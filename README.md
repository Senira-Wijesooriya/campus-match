# Campus Match

A Tinder-style web app for students. Scan a QR code on your phone (Chrome or
Edge) → sign in with an email code → set up a profile → swipe → chat with
matches. No native app, no app store — it's just a website.

## 1. Create your free backend (Supabase)

1. Go to https://supabase.com and create a free account + new project.
2. Once it's created, open **SQL Editor** → **New query**, paste in the
   entire contents of `supabase/schema.sql` from this project, and run it.
   This creates all the tables, security rules, and the auto-matching logic.
3. Go to **Authentication → Providers → Email** and make sure Email OTP
   (one-time code) sign-in is enabled. Under **Authentication → Emails**,
   you can customize the "Magic Link / OTP" email template if you want.
4. Go to **Project Settings → API**. You'll need two values from here:
   - **Project URL**
   - **anon public** key

## 2. Configure the app

1. Copy `.env.local.example` to `.env.local`.
2. Paste in your Project URL and anon key.
3. Leave `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN` blank for now (any email can sign
   up). When you're ready to restrict this to students, set it to your
   school's domain, e.g. `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN=university.edu`.

## 3. Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll see the QR code screen. Since your phone
can't reach `localhost` on your computer, testing the QR scan itself only
works once it's deployed (step 4). Locally, just click "Already scanned?
Continue on this phone" to test the flow in your browser.

## 4. Deploy for free (Vercel)

1. Push this project to a GitHub repository.
2. Go to https://vercel.com, sign in with GitHub, and import the repo.
3. In the Vercel project's **Environment Variables** settings, add the same
   three variables from your `.env.local`.
4. Deploy. Vercel gives you a live URL like `campus-match.vercel.app`.
5. Open that URL — the QR code on the landing page will now encode your
   real live link, so scanning it on a phone opens the actual site.

## How the pieces fit together

- **Landing page** (`/`) — shows a QR code pointing at the site's own URL.
- **Login** (`/login`) — student enters their email, Supabase sends a 6-digit
  code.
- **Verify** (`/verify`) — student enters the code, which logs them in.
- **Profile setup** (`/profile-setup`) — first-time users create a profile
  (name, birthdate, photo, bio). Blocks under-18 signups.
- **Discover** (`/discover`) — swipeable card deck of other students. Liking
  someone who already liked you creates a match automatically (handled by a
  database trigger in `schema.sql`).
- **Matches** (`/matches`) — list of everyone you've matched with.
- **Chat** (`/chat/[matchId]`) — real-time messaging with a match, powered by
  Supabase Realtime.

## Security notes

- Row Level Security (RLS) is enabled on every table, so the database itself
  enforces that users can only read/write their own data and data from
  people they've matched with — even if someone tampers with the frontend.
- Profile photos live in a Supabase Storage bucket; only signed-in users can
  view them, and users can only upload into their own folder.

## Before opening this to real users

- **Age verification**: the profile form blocks anyone under 18 based on the
  birthdate they enter, but this is self-reported. If you want stronger
  verification later, you'd add an ID-check step.
- **Reporting & blocking**: not included in this MVP. Add a `reports` table
  and a block list before letting strangers message each other for real.
- **Terms of Service / Privacy Policy**: you'll want these in place before
  launch — a free generator or a lawyer, depending on your risk tolerance.
- **Moderation**: consider reviewing new profile photos/bios before they go
  live, at least early on.
