# Verilo — Push notifications setup (one time)

1. In the Verilo folder run: `npm install web-push@3.6.7 --save-exact` (updates package.json + package-lock.json).
2. **Supabase (Verilo project) → SQL Editor**: run `supabase/migration_34_push.sql`.
3. **Vercel → Settings → Environment Variables** (Production): 
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = Public key (same pair you made for Dukaan: `npx web-push generate-vapid-keys`)
   - `VAPID_PRIVATE_KEY` = Private key
   - `VAPID_SUBJECT` = `mailto:` + your email
   Redeploy.
4. Provider dashboard → tap "Turn on alerts for reviews & calls".
5. Test: leave a review (from another account) or tap Call on the listing → provider phone gets an alert (Call/WhatsApp alerts are limited to one per listing per 15 minutes).
