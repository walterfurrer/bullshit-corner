<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# Bullshit Corner

Bullshit Corner is the fan-built web app behind [bscorner.com](https://bscorner.com). Users browse and submit Formula 1 hot takes; admins review them and maintain the leaderboard.

## Stack

- **App:** React 19, TanStack Start, TanStack Router, Vite 8, and Nitro SSR.
- **Data:** Convex with `@convex-dev/react-query`; backend code lives in `convex/`.
- **Auth:** Clerk, with Convex JWT auth and Clerk `publicMetadata.role === 'admin'` for RBAC.
- **UI:** Tailwind CSS v4, shadcn/ui with Base UI primitives, and Phosphor icons.
- **Hosting:** Vercel. Its build command deploys Convex functions and injects `VITE_CONVEX_URL` before building the app.

## Product map

- **Public:** `/` shows ranked `bullshitCornerEntries`; `/submit-topic` accepts authenticated submissions.
- **User:** `/onboarding`, `/yourSubmissions`, and `/userSettings` cover identity, anonymity, and Clerk account settings.
- **Admin:** `/admin` redirects to leaderboard management. Admins can create, edit, reorder, and remove entries; promote or dismiss submissions; and manage Clerk admin roles.
- **Data model:** `users`, `bullshitCornerEntries`, and `submissions` are defined in `convex/schema.ts`.

## Daily workflow

```bash
pnpm install
pnpm dev
pnpm check
```

- `pnpm dev` runs Vite on port 3000 and `convex dev` together. Use `pnpm dev:web` or `pnpm dev:convex` for isolated logs.
- `pnpm check` runs TypeScript, unit tests, and the production build. Run it before handing work off.
- `pnpm generate-routes` regenerates `src/routeTree.gen.ts` after routing changes.
- Copy `.env.example` to `.env.local` for a new machine. Never commit env files or credentials.

## Generated files and source boundaries

- Do not edit `src/routeTree.gen.ts` or anything in `convex/_generated/` by hand.
- Import application code through `#/*`, Convex through `#convex/*`, and shared code through `#shared/*`.
- Keep server-only Clerk work in `src/server/` or TanStack Start server functions. Never expose `CLERK_SECRET_KEY` through a `VITE_` variable.

## Authentication and data safety

- Before editing code in `convex/`, read `convex/_generated/ai/guidelines.md`, then use the relevant Convex skill. Use `convex-expert` first for normal backend changes.
- Convex admin functions must enforce `requireAdmin`; client-side guards are not authorization.
- The `convex/seed.ts` internal mutation deletes every app table before inserting sample data. Never run it against a deployment containing real data.
- `convex/backfillClerkNames.ts` is a one-time, dashboard-run internal action. Do not invoke it casually.
- Before a cloud-affecting Convex or Vercel command, verify the active identity and deployment. Cached CLI sessions have previously targeted the wrong account. Require explicit confirmation before production deploys, migrations, or secret changes.
- Auth UI is opt-in per environment: `VITE_ENABLE_AUTH=true` enables it.

## Deployment

`vercel.json` wraps the app build in:

```bash
npx convex deploy --cmd-url-env-var-name VITE_CONVEX_URL --cmd 'pnpm build'
```

Vercel must provide `CONVEX_DEPLOY_KEY`: a production deploy key for Production and a project Preview Deploy Key for Preview. Do not configure `CONVEX_DEPLOYMENT` or `VITE_CONVEX_URL` as static Vercel variables.

## Skills

Keep the local skill set focused on repeated work in this codebase:

- **Convex:** `convex`, `convex-expert`, `convex-docs`, `convex-reviewer`, `convex-authz`, `convex-test`, `convex-verify`, `convex-deploy-guard`, `convex-migrate`, `convex-migrate-rehearse`, `convex-insights`, and `convex-seed`.
- **Clerk:** `clerk`, `clerk-tanstack-patterns`, `clerk-cli`, and `clerk-backend-api`.
- **UI:** `shadcn` and `phosphor-icons`.

The pinned sources are recorded in `skills-lock.json`. Add specialist skills only when the work calls for them; do not retain unused billing, organization, agent, or migration-from-Radix guidance by default.

## Tailwind conventions

- Use Tailwind v4 names: `shadow-xs`, `rounded-xs`, `blur-xs`, `bg-linear-*`, and `outline-hidden`.
- Use `gap-*` in flex and grid containers; avoid `space-x-*` and `space-y-*` there.
- Pair text size with line height (`text-base/7`), use `size-*` for square elements, and use `/50` opacity syntax.
- Prefer logical properties (`ms-*`, `pe-*`, `start-*`, `text-start`) except for deliberately fixed visual axes.
- Use `min-h-dvh`, not `min-h-screen`.
