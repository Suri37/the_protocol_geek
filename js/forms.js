function getSupabaseClient() {
  const config = window.TPG_SUPABASE_CONFIG || {};
  if (!config.url || !config.anonKey || config.url.includes('PASTE_') || config.anonKey.includes('PASTE_')) {
    throw new Error('Supabase is not configured yet. Update js/supabase-config.js with your project URL and anon public key.');
  }
  return window.supabase.createClient(config.url, config.anonKey);
}

function setFormStatus(form, message, isError = false) {
  const status = form.querySelector('[data-form-status]');
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? '#b42318' : '#0b4ea2';
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

    const supabaseClient = getSupabaseClient();
    const { error } = await supabaseClient.from(table).insert(payload);

    if (error) throw error;

    form.reset();
    setFormStatus(form, 'Thank you. Your details have been submitted successfully.');
  } catch (error) {
    console.error(error);
    setFormStatus(form, error.message || 'Something went wrong. Please try again.', true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Submit';
  }
}

document.querySelectorAll('form[data-supabase-table]').forEach((form) => {
  form.addEventListener('submit', submitToSupabase);
});
