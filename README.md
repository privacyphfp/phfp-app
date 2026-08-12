# PHFP App

Student portal for the Pranic Healing Foundation of the Philippines — accounts,
course registration, certificates, calendar of events, and role-based
dashboards for Admin, Marketing, Accounting, and Students.

This is a separate codebase from `clinic-booking-app`, with its own GitHub,
Supabase, and Vercel accounts.

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS v4
- Supabase (auth, database, file storage for certificates/materials)

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in your Supabase project's
   URL and keys once the Supabase project exists:

   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  admin/         Admin dashboard
  marketing/     Marketing dashboard
  accounting/    Accounting dashboard
  student/       Student portal
  login/
  signup/
lib/
  supabase/
    client.js    Browser Supabase client
    server.js    Server component Supabase client
    admin.js     Service-role client (server-only, bypasses RLS)
    middleware.js Session refresh helper used by middleware.js
```

Routes and data model are placeholders — course structure, prerequisites,
certificates, payments, and the full feature set are still being defined.

## Status

- [x] Project scaffold (Next.js + Tailwind)
- [ ] Git repo (waiting on new GitHub account)
- [ ] Supabase project + schema
- [ ] Vercel deployment
