# newsletter-app

Internal admin panel for EDGE — team management, auth, profile, invites and settings.

## Stack

- Next.js 16 (App Router, React Server Components, server actions) + Turbopack
- React 19
- TypeScript (strict, `noUncheckedIndexedAccess`)
- Tailwind CSS v4 (CSS-first via `@theme inline` in [src/app/globals.css](src/app/globals.css))
- Supabase (auth + Postgres) through `@supabase/ssr`

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:3000
```

### Required environment

See [.env.example](.env.example). `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `PLATFORM_ENCRYPTION_KEY` (32-byte hex) are required. `SUPABASE_PUBLISHABLE_KEY` is optional — when missing, the anon key is decrypted at runtime from the `settings` table via [src/lib/crypto.ts](src/lib/crypto.ts) (AES-256-GCM).

`APP_URL` is used to build invite / reset-password links.

## Scripts

| Command                | What it does                                 |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Local dev server (Turbopack)                 |
| `npm run build`        | Production build (Turbopack)                 |
| `npm run start`        | Run the production build                     |
| `npm run typecheck`    | `tsc --noEmit`                               |
| `npm run lint`         | ESLint                                       |
| `npm run lint:fix`     | ESLint with autofix                          |
| `npm run format`       | Prettier write                               |
| `npm run format:check` | Prettier check                               |
| `npm run check`        | typecheck + lint + format:check (pre-commit) |

## Architecture

- **`src/app/`** — App Router. Auth routes (`login`, `forgot-password`, `auth/*`) live at the root. The authenticated shell is under the `(app)/` route group (dashboard, users, settings, profile).
- **`src/proxy.ts`** — Next 16's renamed middleware. Strips inbound identity headers, validates the session on protected routes, and re-injects `x-user-id` / `x-user-email` / `x-user-name` for server components to read.
- **`src/lib/supabase/`**
  - `admin.ts` — service-role client, server-only, `React.cache`'d
  - `dynamic.ts` — anon-key SSR client for server components and middleware; resolves the anon key from env or (fallback) decrypts from the `settings` table
- **`src/providers/SupabaseProvider.tsx`** — browser client via React context (used by client components that need the Supabase JS SDK)
- **Server actions** return `ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }`. Keep this shape when adding new actions.

## Theme

Editorial neutral palette — off-white (`#fafaf9`) surfaces, near-black (`#0a0a0a`) foreground, thin warm-gray borders. Tokens are defined in [src/app/globals.css](src/app/globals.css) and exposed to Tailwind via `@theme inline`. Use the tokens (`bg-surface`, `text-foreground`, `border-border`, `text-text-secondary`, `bg-primary`, …) rather than reintroducing warm/cream hues or decorative color accents.

## Deploy

Deployed on Vercel. The only prerequisite is setting the required env vars in the Vercel project settings.
