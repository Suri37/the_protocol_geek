const ALLOWED_TABLES = new Set([
  'study_participants',
  'investigator_registrations'
]);

const EXPECTED_SUPABASE_HOST = 'infouuskwmrcymwgaqdi.supabase.co';

function sendJson(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

function isValidSupabaseUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.hostname === EXPECTED_SUPABASE_HOST;
  } catch (_) {
    return false;
  }
}

async function readResponseBody(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (_) {
    return { message: text };
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  const { table, payload, supabaseUrl, anonKey } = request.body || {};

  if (!ALLOWED_TABLES.has(table)) {
    return sendJson(response, 400, { error: 'Invalid registration type.' });
  }

  if (!payload || typeof payload !== 'object' || payload.consent !== true) {
    return sendJson(response, 400, { error: 'Consent is required.' });
  }

  if (!isValidSupabaseUrl(supabaseUrl) || typeof anonKey !== 'string' || !anonKey.startsWith('sb_publishable_')) {
    return sendJson(response, 500, { error: 'Registration service configuration is invalid.' });
  }

  const baseUrl = supabaseUrl.replace(/\/$/, '');
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json'
  };

  try {
    const saveResponse = await fetch(`${baseUrl}/rest/v1/${encodeURIComponent(table)}`, {
      method: 'POST',
      headers: {
        ...headers,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!saveResponse.ok) {
      const errorBody = await readResponseBody(saveResponse);
      return sendJson(response, saveResponse.status, {
        error: errorBody.message || errorBody.error || 'We could not save your registration.'
      });
    }

    let notificationSent = false;
    let notificationError = null;

    try {
      const notificationResponse = await fetch(`${baseUrl}/functions/v1/notify-new-submission`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          table,
          payload,
          submittedAt: new Date().toISOString()
        })
      });

      notificationSent = notificationResponse.ok;

      if (!notificationResponse.ok) {
        const errorBody = await readResponseBody(notificationResponse);
        notificationError = errorBody.error || errorBody.message || 'Notification request failed.';
      }
    } catch (error) {
      notificationError = error.message || 'Notification request failed.';
    }

    return sendJson(response, 200, {
      ok: true,
      saved: true,
      notificationSent,
      notificationError
    });
  } catch (error) {
    console.error('Registration API failed:', error);
    return sendJson(response, 502, {
      error: 'The registration service could not be reached. Please try again shortly.'
    });
  }
}
