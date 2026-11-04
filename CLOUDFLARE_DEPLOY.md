# Verilo → Cloudflare (Workers) — step by step

Vercel wala live site ab bhi chalta rahega. Ye sab alag branch `cloudflare` par hoga.

## 0. Code ek nayi branch me daalo
```
cd D:\verilo-app\verilo-app
git checkout -b cloudflare
(zip ka content copy/replace karo — node_modules mat copy karna)
npm install
git add -A
git commit -m "Move Verilo to Cloudflare (Next 15 + OpenNext)"
git push -u origin cloudflare
```

## 1. Brevo (email) — free 300 mail/day
1. brevo.com par signup -> Senders & IP -> Add a sender (apna Gmail chalega) -> verify mail click karo.
2. SMTP & API -> API Keys -> Generate -> key copy karo.

## 2. Cloudflare par project
1. dash.cloudflare.com -> Workers & Pages -> Create -> **Import a repository** -> GitHub `Hector988725/verilo`.
2. Production branch: `cloudflare`. Project name: `verilo`.
3. Build command: `npx opennextjs-cloudflare build`
   Deploy command: `npx opennextjs-cloudflare deploy`
4. **Variables** (Settings -> Variables and Secrets), Vercel wale hi naam:
   - Config/Text (build me bhi chahiye -> "Build variables" me bhi daalo): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_RAZORPAY_KEY_ID, NEXT_PUBLIC_VAPID_PUBLIC_KEY, NEXT_PUBLIC_SITE_URL (final domain), VAPID_SUBJECT, RAZORPAY_MONTHLY_PLAN_ID, EMAIL_FROM (Brevo me verified email), EMAIL_FROM_NAME (Verilo)
   - Secret: SUPABASE_SERVICE_ROLE_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, ADMIN_PASSCODE, OTP_PROOF_SECRET, CRON_SECRET, VAPID_PRIVATE_KEY, BREVO_API_KEY
   - GMAIL_USER / GMAIL_APP_PASSWORD ab nahi chahiye.
5. Deploy. Pehle `*.workers.dev` URL par test karo.

## 3. Test checklist (workers.dev URL par)
- Home, city page, PIN search
- Provider signup + OTP email aana
- Listing add, rating, call-track -> provider ko push
- Razorpay test payment (verify route)
- Admin login

## 4. Domain
Workers -> verilo -> Settings -> Domains & Routes -> Add custom domain. (Domain Cloudflare DNS par ho to automatic.) Phir NEXT_PUBLIC_SITE_URL update karke redeploy.

## 5. Razorpay webhook
Razorpay Dashboard -> Webhooks -> URL badal kar `https://<naya-domain>/api/razorpay/subscription-webhook` (secret wahi).

## 6. Cron
wrangler.jsonc me 2 cron hain (02:00 aur 02:30 UTC) -> expire-listings, expiry-reminders. CRON_SECRET set hona zaroori hai. Dashboard -> verilo -> Settings -> Triggers me dikhenge.

## 7. Switch
Sab test OK hone par domain Vercel se hata kar Cloudflare par lagao, phir Vercel project band karo.

## Kya badla
- Next 14 -> 15 (params/cookies async), React 19
- nodemailer -> Brevo HTTP API (lib/email.js)
- razorpay SDK -> lib/razorpay.js (fetch)
- web-push -> @block65/webcrypto-web-push
- vercel.json crons -> worker.js scheduled
