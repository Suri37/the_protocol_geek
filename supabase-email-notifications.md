# The Protocol Geek - Supabase Email Notifications

This website now calls a Supabase Edge Function named `notify-new-submission` after a participant or investigator/site form is saved.

## What this does

When someone submits either form:

1. The record is saved in Supabase.
2. The website calls the Edge Function.
3. The Edge Function sends an email to `hello@theprotocolgeek.com`.

## One-time setup required

### 1. Create a Resend account

Use Resend or another transactional email provider. This function is currently written for Resend.

### 2. Verify your sending domain

Verify `theprotocolgeek.com` in Resend before sending from `hello@theprotocolgeek.com`.

### 3. Add Supabase Edge Function secrets

In Supabase Dashboard, go to:

Project Settings → Edge Functions → Secrets

Add:

```bash
RESEND_API_KEY=your_resend_api_key
ADMIN_EMAIL=hello@theprotocolgeek.com
FROM_EMAIL=The Protocol Geek <hello@theprotocolgeek.com>
```

### 4. Deploy the Edge Function

From your local repo:

```bash
supabase login
supabase link --project-ref infouuskwmrcymwgaqdi
supabase functions deploy notify-new-submission
```

## Notes

- The website submission still succeeds even if email notification fails.
- Never add `RESEND_API_KEY` to frontend JavaScript or GitHub public files.
- Keep `RESEND_API_KEY` only inside Supabase Edge Function secrets.
