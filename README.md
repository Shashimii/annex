# Annex

A personal space to check in with yourself: track your money today, and your focus tomorrow.

Annex is a local-first web app. Data is saved in the browser (IndexedDB) and, from v0.3, synced to the user's own Google Drive. There is no server database.

- Spec: [.ai/system.md](.ai/system.md)
- Development phases: [.ai/phases.md](.ai/phases.md)

## Stack

Vite, React, TypeScript, Tailwind CSS, shadcn/ui, React Router, Zustand, Dexie, Zod, Vitest.

## Run

```bash
npm install
npm run dev
```

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint the codebase |
| `npm test` | Run unit tests |

Copy `.env.example` to `.env` before working on Google sign-in (v0.3).

Built by **Shashimii**.
