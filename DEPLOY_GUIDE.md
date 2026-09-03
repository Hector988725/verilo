# Verilo — Deployment Guide (No Coding Needed)

Follow these steps in order. Everything happens in your web browser — no
command line, no coding. Budget about 45-60 minutes for the first setup.

---

## STEP 1: Put the code on GitHub

1. Go to https://github.com and sign up (free) if you don't have an account.
2. Click the **"+"** icon top-right → **"New repository"**.
3. Name it `verilo`, keep it **Public** or **Private** (either is fine), click **"Create repository"**.
4. On the new repo page, click **"uploading an existing file"**.
5. Drag and drop **the entire `verilo-app` folder contents** (not the folder itself — all files and subfolders inside it) into the upload box.
6. Scroll down, click **"Commit changes"**.

Your code is now on GitHub.

---

## STEP 2: Set up Supabase (your database)

1. Go to https://supabase.com → Sign up with GitHub (one click).
2. Click **"New Project"**. Name it `verilo`, set a database password (save it somewhere safe), choose the region closest to India (e.g. Mumbai/Singapore), click **"Create new project"**. Wait ~2 minutes.
3. Once ready, go to the left sidebar → **SQL Editor** → **New query**.
4. Open the `supabase/schema.sql` file (from the code you uploaded), copy **all** of it, paste into the SQL editor, click **"Run"**. This creates all your tables.
5. Go to left sidebar → **Storage** → **"New bucket"**. Name it exactly `listing-photos`, toggle **"Public bucket"** ON, click **"Create bucket"**. This is where profile photos will be stored.
6. Go to left sidebar → **Project Settings → API**. You'll need three values from this page in Step 4:
   - **Project URL**
   - **anon public key**
   - **service_role key** (click "Reveal" to see it — keep this secret, never share it)

---

## STEP 3: Set up Razorpay (payments)

1. Log in to your existing Razorpay dashboard: https://dashboard.razorpay.com
2. Go to **Settings → API Keys → Generate Live Key** (if you haven't already). Save the **Key Id** and **Key Secret** somewhere safe — Razorpay only shows the secret once.
3. You'll use these two values in Step 4.

---

## STEP 4: Deploy on Vercel (makes your app live on the internet)

1. Go to https://vercel.com → **Sign up with GitHub** (one click, uses the same account from Step 1).
2. Click **"Add New" → "Project"**.
3. Find your `verilo` repository in the list and click **"Import"**.
4. Before clicking Deploy, open **"Environment Variables"** and add each of these one by one (name on the left, value on the right):

   | Name | Value (from earlier steps) |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key |
   | `RAZORPAY_KEY_ID` | Your Razorpay Key Id |
   | `RAZORPAY_KEY_SECRET` | Your Razorpay Key Secret |
   | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same as Razorpay Key Id (yes, again) |
   | `LISTING_FEE_PAISE` | `3000` (this means ₹30 — change if you want a different rate) |

5. Click **"Deploy"**. Wait 1-2 minutes.
6. You'll get a live link like `https://verilo-yourname.vercel.app` — this is your real, working app that anyone can open in a normal browser, no Claude needed.

---

## STEP 5: Test it before sharing

1. Open your live link on your own phone.
2. Add a test listing for yourself with your own number.
3. Try the **"Pay ₹30"** button — use a small real payment or Razorpay's test mode first (Settings → toggle to Test Mode temporarily if you want to test without real money, then switch back to Live Mode before sharing with real users).
4. Once it all works, share the link in your WhatsApp groups.

---

## Ongoing costs (all optional/free tiers to start)

- **GitHub**: Free
- **Vercel**: Free tier is enough for a few thousand visits/month
- **Supabase**: Free tier includes 500MB database + 1GB file storage — plenty to start
- **Razorpay**: No fixed fee, they take a small % per transaction (check your dashboard for your rate)

You can run this for months at ₹0 hosting cost while it grows.

---

## If you get stuck

Take a screenshot of exactly where you're stuck and bring it back to this
conversation — describe which step number and what error/screen you're
seeing, and I'll walk you through it.
