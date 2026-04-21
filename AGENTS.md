# AGENTS.md

Project brief for agentic tools (Claude Code, Codex, Cursor, etc.) working on this repo.

## What this is

EDGE newsletter-app — internal admin panel for team management. Next.js 16 App Router, React 19, Tailwind v4, Supabase SSR. Romanian UI copy.

## Stack

- **Framework:** Next.js 16 (App Router, React Server Components, server actions)
- **Runtime:** React 19
- **Styling:** Tailwind CSS v4 (CSS-first config via `@theme inline` in [src/app/globals.css](src/app/globals.css))
- **Data:** Supabase (auth + Postgres) via `@supabase/ssr`
- **Language:** TypeScript strict mode, `noUncheckedIndexedAccess`
- **Package manager:** npm

## Required env vars

See [.env.example](.env.example). `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `PLATFORM_ENCRYPTION_KEY` are required. `SUPABASE_PUBLISHABLE_KEY` is optional — when absent, the anon key is decrypted from the `settings` table via [src/lib/crypto.ts](src/lib/crypto.ts) (AES-256-GCM).

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` / `npm run lint:fix`
- `npm run format` / `npm run format:check`
- `npm run check` — typecheck + lint + format:check (run before committing)

## Architecture conventions

- **Route groups:** `(app)/` = authenticated shell (dashboard, users, settings, profile). Auth pages (`login`, `forgot-password`, `auth/*`) live at the root.
- **Middleware:** [src/proxy.ts](src/proxy.ts) (Next 16's renamed `middleware`). Strips inbound identity headers, validates session, re-injects `x-user-id` / `x-user-email` / `x-user-name` for protected routes.
- **Supabase clients:**
  - [src/lib/supabase/admin.ts](src/lib/supabase/admin.ts) — service-role, **server-only**, `React.cache`d
  - [src/lib/supabase/dynamic.ts](src/lib/supabase/dynamic.ts) — anon-key SSR client (server components + middleware)
  - [src/providers/SupabaseProvider.tsx](src/providers/SupabaseProvider.tsx) — browser client via React context
- **Server actions** return `ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }`. Keep this shape when adding new actions.
- **`server-only` import** guards any module that reads secrets / uses the service-role key.

## Theme

Editorial neutral palette — off-white `#fafaf9` surfaces, near-black `#0a0a0a` foreground. Defined entirely as CSS custom properties in [src/app/globals.css](src/app/globals.css) with `.dark` overrides. Use tokens (`bg-surface`, `text-foreground`, `border-border`, `text-text-secondary`, `bg-primary`) — do not introduce warm/cream hues or decorative color accents. Radius is tight (`--radius-xs: 0.375rem`). Prefer `shadow-xs/sm/md/lg` tokens over heavy borders.

## What to avoid

- Leaking the service-role key into client components (only `admin.ts` touches it, and it's `"server-only"`).
- Calling `useSupabase()` outside the `SupabaseProvider` subtree.
- Adding new server actions without the `ActionResult<T>` shape.
- Reintroducing `create-next-app` boilerplate (Geist fonts, Vercel SVGs, default `public/` assets).
