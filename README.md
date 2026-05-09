# Caret

Cursor-inspired clone

## Tech

- `Next.js 16`
- `React` 
- `TypeScript` 
- `Tailwind CSS v4` 
- `shadcn/ui`
- `@t3-oss/env-nextjs`
- `Zod`
- `Clerk`
- `Convex`
- [`Vercel AI SDK`](https://github.com/vercel/ai)
  - Google 
  - Anthropic
- `Inngest`
- `Firecrawl`
- `Sentry`
- `CodeMirror`
- `Zustand`
- `TanStack React Form`
- `CMDk`
- `Allotment`
- `KY`

### Tooling

- `Biome` for linting/formatting/import organization
- `Lefthook` for git hooks
- `Concurrently` for parallel script running

### Personal packages
[![Code linting and formatting](https://github.com/C-Mierez/caret/actions/workflows/biome-ci.yml/badge.svg?branch=master)](https://github.com/C-Mierez/caret/actions/workflows/biome-ci.yml)
[![Env Sync Check](https://github.com/C-Mierez/caret/actions/workflows/env-sync-check.yml/badge.svg?branch=master)](https://github.com/C-Mierez/caret/actions/workflows/env-sync-check.yml)

- [`@c-mierez/biome-config`](https://github.com/C-Mierez/biome-config) for git hooks and actions for linting and formatting
- [`@c-mierez/env-sync`](https://github.com/C-Mierez/env-sync) for git hooks and actions for syncing env files

## Technical aspects of note
- Convex data is usually prefetched on the server with small HOCs, so routes can load their data before the client tree renders.
- A shared protected-data HOC handles Convex auth once, grabs the token, and redirects cleanly when a route should not render.
- UI stays separate from data work: providers, hooks, and Zustand stores manage state, while the visible components stay focused on presentation.
- Zustand is used for local UI state like editor state, and some stores expose a tiny "request" pattern so other parts of the app can react to one-off commands.
- Modal flow is wrapped in a responsive helper that switches between drawer and dialog behavior, with small modal hooks to keep new modals easy to wire up.
- Convex auth supports both user sessions and machine requests, so background jobs and server-side work can safely use the same backend.
- Server and client boundaries stay explicit: server code uses `preloadQuery` and `fetchQuery`, while client components consume the generated Convex API and React hooks.
- AI features lean on the Vercel AI SDK plus Google/Gemini integrations, with NDJSON streaming helpers for chunked responses and a matching client consumer.
- Inngest handles background/event-driven work, and the handlers run against Convex with a machine token instead of a user session.
- The file editor is built around CodeMirror, with custom extensions and a split between the file tree, editor view, and editor-specific behavior.
- Routing and environment checks are centralized: `proxy.ts` protects routes, and `env.ts` keeps required env vars validated in one place.
