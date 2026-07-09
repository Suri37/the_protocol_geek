const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function labelize(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildRows(payload: Record<string, unknown>) {
  return Object.entries(payload)
    .filter(([key]) => !['source', 'consent'].includes(key))
    .map(([key, value]) => `<tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:700;">${labelize(key)}</td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(value)}</td></tr>`)
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'hello@theprotocolgeek.com';
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'The Protocol Geek <hello@theprotocolgeek.com>';

    if (!resendApiKey) {
      throw new Error('Missing RESEND_API_KEY secret.');
    }

    const { table, payload, submittedAt } = await req.json();
    const submissionType = table === 'study_participants' ? 'New participant registration' : 'New investigator/site registration';

    const html = `
      <div style="font-family:Arial,sans-serif;color:#12345b;">
        <h2>${submissionType}</h2>
        <p>A new website form was submitted on ${escapeHtml(submittedAt)}.</p>
        <table style="border-collapse:collapse;width:100%;max-width:720px;">${buildRows(payload || {})}</table>
        <p style="margin-top:20px;">Please review this record in Supabase Table Editor.</p>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [adminEmail],
        subject: `${submissionType} - The Protocol Geek`,
        html
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
