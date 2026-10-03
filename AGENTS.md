# AGENTS.md — Mejenga

## Overview

Mejenga is a web app to organize pickup soccer games in Costa Rica. An invite-only admin creates a match, shares a public link in WhatsApp, players join with name + phone (no account), upload a SINPE Móvil payment screenshot, and the admin manually approves/rejects each proof to confirm them. UI language: **Spanish**. Greenfield project — stack and flows are fixed by the approved plan below.

## Commands

```bash
npm run dev          # local dev server (Next.js, port 3000)
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest unit tests
make lint|static-check|complexity|security|build   # Makefile gates
npx supabase login   # once per machine
npx supabase link --project-ref <ref>   # once per clone
npx supabase db push # apply migrations to the linked project
```

Note: scripts take effect once the scaffold exists (Phase 0).

## Architecture

- **Next.js 16 App Router** (TypeScript, Tailwind, ESLint), scaffolded from the official `with-supabase` template. Server Actions for admin mutations, Route Handlers for the public join/status/upload APIs. Deploys on Vercel (Node.js runtime); repo is public on GitHub.
- **Supabase**: Postgres with RLS on every table, Auth (email **magic link**, signups disabled — admins are invited by email), Storage bucket `payment-proofs` (private, accessed via signed URLs).
- **Tables**: `admins` (→ `auth.users`, has default `sinpe_phone`), `matches` (slug, date/time, location, `price_crc`, `sinpe_phone`, status open/cancelled/finished), `registrations` (match_id, name, phone unique per match, status, `payment_proof_path`, secret `view_token`).
- **Single-match lifecycle (product rule)**: only one match exists at a time. Creating a new match first empties the previous matches' storage folders (`payment-proofs/{matchId}/`), then deletes the match rows (registrations cascade). A match row is deleted only after its storage folder is empty, so proof screenshots can never be orphaned. Only `admins` persists across matches. See `clearPreviousMatches` in `lib/actions/matches.ts`.
- **Registration status machine**: `pending` (joined, no proof) → `proof_submitted` → `approved` | `rejected` (rejected → player may re-upload). Admin can also approve without proof (cash).
- **Player flow**: link `/m/[slug]` → join form → secret status page `/m/[slug]/p/[view_token]` (payment instructions + upload + live status). Players have **no auth**; access is via `view_token` validated server-side.
- **Admin flow**: `/admin/login` (magic link) → dashboard → create/edit/cancel matches → match detail with player list, screenshot review (approve/reject), stats → invite admins, SINPE settings.
- **First admin**: `BOOTSTRAP_ADMIN_EMAIL` env — that email is auto-promoted to admin on first login; all other admins are invited from the dashboard.

## Key conventions

- **All UI strings in Spanish** (dates/numbers via `es-CR` locale, prices in colones `₡`).
- Shared **zod schemas** for every input (join form, match form, upload) — validate on both client and server.
- **Service role key** (`SUPABASE_SERVICE_ROLE_KEY`) only in server-side env — never `NEXT_PUBLIC_*`, never imported into client components. Use the `@supabase/ssr` client helpers from the template (`with-supabase`); follow the Supabase Next.js SSR guide (`proxy.ts` on Next 16, `getAll`/`setAll` cookie pattern only).
- **RLS is mandatory** and is defense-in-depth: anon may only `SELECT matches` and `INSERT registrations` (into open matches); no anon read of `registrations`. Player status is served through server routes using `view_token`.
- **PII rule**: player names and phone numbers are personal data. They live only in Supabase. Never paste player data into external prompts, services, or commit it to the repo. If a task needs to reference real player records, use markers (`<NOMBRE>`, `<TELÉFONO>`).
- Uploads: validate mime (jpg/png/webp) and size; client compresses images to ≤2 MB before POST (Vercel request body limit ~4.5 MB).

## Testing

- **TDD for logic**: zod schemas, phone normalization (CR format), slug generation, status transitions → Vitest unit tests written first.
- Always run `npm run lint && npm run typecheck && npm run test` before considering a task done; `npm run build` must pass before deploy.
- E2E flows (join → upload → approve) verified manually against the local app / deployed preview — no E2E framework in v1.

## Git workflow

- Small, focused commits; message style: `feat:`, `fix:`, `chore:`, `test:`, `docs:` (imperative summary).
- Never commit `.env.local`, `*.env` secrets, or Supabase keys. `.env.example` documents variable names only.
- Push to `main` on GitHub; Vercel auto-deploys the linked project.

## Gotchas

- Supabase Auth needs `Site URL` + redirect URLs configured for magic link to work in production (see README setup checklist).
- Phone uniqueness: one registration per phone per match — surface a friendly Spanish error on duplicate.
- Match slugs are public by design (share links) — do not put sensitive data in slugs or match fields.
- No team/lineup features, no OCR, no WhatsApp Business API in v1 (out of scope per approved plan).
