function getSupabaseConfig() {
  const config = window.TPG_SUPABASE_CONFIG || {};

  if (!config.url || !config.anonKey || config.url.includes('PASTE_') || config.anonKey.includes('PASTE_')) {
    throw new Error('The registration service is not configured. Please contact hello@theprotocolgeek.com.');
  }

  return {
    url: config.url.replace(/\/$/, ''),
    anonKey: config.anonKey
  };
}

function setFormStatus(form, message, isError = false) {
  const status = form.querySelector('[data-form-status]');
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? '#b42318' : '#0b4ea2';
}

async function fetchWithTimeout(url, options, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function parseErrorResponse(response, fallbackMessage) {
  let details = '';

  try {
    const body = await response.json();
    details = body.message || body.error || body.msg || body.hint || '';
  } catch (_) {
    try {
      details = await response.text();
    } catch (_) {
      details = '';
    }
  }

  return new Error(details || fallbackMessage);
}

async function saveSubmission(table, payload) {
  const { url, anonKey } = getSupabaseConfig();
  const endpoint = `${url}/rest/v1/${encodeURIComponent(table)}`;

  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, 'We could not save your registration. Please try again.');
  }
}

async function sendSubmissionNotification(table, payload) {
  const { url, anonKey } = getSupabaseConfig();
  const endpoint = `${url}/functions/v1/notify-new-submission`;

  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      table,
      payload,
      submittedAt: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, 'The email notification could not be sent.');
  }
}

async function submitToSupabase(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const table = form.dataset.supabaseTable;
  const payload = Object.fromEntries(new FormData(form).entries());

  payload.consent = form.querySelector('[name="consent"]')?.checked || false;
  payload.source = 'website';

  if (!payload.consent) {
    setFormStatus(form, 'Please confirm consent before submitting.', true);
    return;
  }

  try {
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    setFormStatus(form, '');

    await saveSubmission(table, payload);

    try {
      await sendSubmissionNotification(table, payload);
    } catch (notificationError) {
      console.error('The registration was saved, but the notification email failed.', notificationError);
    }

    form.reset();
    setFormStatus(form, 'Thank you. Your details have been submitted successfully.');
  } catch (error) {
    console.error('Registration submission failed:', error);

    const isNetworkFailure = error instanceof TypeError || error.name === 'AbortError';
    const message = isNetworkFailure
      ? 'The connection was interrupted. Please check your internet connection and submit again.'
      : error.message || 'Something went wrong. Please try again.';

    setFormStatus(form, message, true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Submit';
  }
}

document.querySelectorAll('form[data-supabase-table]').forEach((form) => {
  form.addEventListener('submit', submitToSupabase);
});
