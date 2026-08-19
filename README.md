# Bullshit Corner

Bullshit Corner is a fan-built website for ranking Formula 1 hot takes, inspired by the High Performance Racing podcast. It runs at [bscorner.com](https://bscorner.com).

## What it does

- Displays a public, ranked leaderboard.
- Lets signed-in users submit topics, include optional details or a YouTube link, and stay anonymous.
- Gives admins a review queue and tools to promote, dismiss, edit, and re-rank entries.
- Provides user settings for identity, connected accounts, email, password, and account deletion.

## Stack

TanStack Start, React 19, Convex, Clerk, Tailwind CSS v4, shadcn/ui, Base UI, and Vercel.

## Develop

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The web app starts at <http://localhost:3000>; Convex syncs alongside it. See `.env.example` for the required local variables.

## Verify

```bash
pnpm check
```

This runs TypeScript, the Vitest suite, and the production build.

GitHub Actions runs the same check for pull requests and pushes to `main`.

## Deployment

Vercel runs the build command in `vercel.json`, which deploys Convex functions and provides the right `VITE_CONVEX_URL` for the build. Configure `CONVEX_DEPLOY_KEY` in Vercel for both Production and Preview; do not set `VITE_CONVEX_URL` statically there.

See [AGENTS.md](AGENTS.md) for architecture, operational safety, and codebase conventions.
