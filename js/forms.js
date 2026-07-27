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

async function fetchWithTimeout(url, options, timeoutMs = 25000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (_) {
    return { error: text };
  }
}

async function submitRegistration(table, payload) {
  const { url, anonKey } = getSupabaseConfig();

  const response = await fetchWithTimeout('/api/submit-registration', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      table,
      payload,
      supabaseUrl: url,
      anonKey
    })
  });

  const body = await parseResponse(response);

  if (!response.ok) {
    throw new Error(body.error || body.message || 'We could not save your registration. Please try again.');
  }

  return body;
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

    const result = await submitRegistration(table, payload);

    form.reset();

    if (result.notificationSent === false) {
      console.warn('Registration saved, but notification email was not sent:', result.notificationError);
    }

    setFormStatus(form, 'Thank you. Your details have been submitted successfully.');
  } catch (error) {
    console.error('Registration submission failed:', error);

    const message = error.name === 'AbortError'
      ? 'The registration service took too long to respond. Please try again.'
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
