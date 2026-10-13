# Annex: Development Phases

Derived from [system.md](system.md). Each phase maps to a roadmap version, ends in something usable, and has a clear "done when" bar. Finish a phase before starting the next; later phases build on the earlier ones.

**Where we are now (2026-10-13):** Phase 1 done except the Vercel deploy. Phase 2 is built and unit-tested; its "done when" checks (a week of real use, full browser pass) are still open.

```
Phase 1  v0.1  Foundation            scaffold, tooling, tokens, shell, money/date utils
Phase 2  v0.2  Budget (local only)   Dexie + Zod, entries, categories, limits, month view
Phase 3  v0.3  Sign-in + Drive sync  GIS auth, Drive client, merge, sync engine
Phase 4  v0.4  PWA + polish          installable, offline, CSV export, tombstone purge
Phase 5  v1.0  Budget release        multi-device QA, production deploy, release
Phase 6  v1.1  Tasks                 task lists, tasks, schema v2
Phase 7  v1.2  Pomodoro              timer, focus sessions, notifications
Phase 8  v1.3  Reports               spending + focus charts (Recharts, lazy-loaded)
```

---

## Phase 1: Foundation (v0.1)

**Goal:** a clean, deployed app shell with the full toolchain and the core utilities that everything else depends on.

### Tasks
- [x] `git init`, first commit, push to GitHub
- [x] Remove template boilerplate (`App.css`, `assets/*`, demo `App.tsx`)
- [x] Replace `README.md` with a short project README pointing to `.ai/system.md`
- [x] Install the stack: `tailwindcss` + `@tailwindcss/vite`, `react-router`, `zustand`, `dexie`, `zod`
- [x] shadcn/ui: `components.json`, `@/` alias, `button`, `card`, `badge`, `progress`, `separator` (add more with `npx shadcn@latest add <name>`)
- [x] Install `vitest` for unit tests (not in system.md; see Open questions)
- [x] Create the folder layout from system.md (`sync/` comes with Phase 3)
- [x] Design tokens: shadcn CSS variables in `src/index.css` (`:root` / `.dark`, mapped in `@theme inline`); dark mode follows the system setting
- [x] App shell: layout, nav, routes for **Budget** (index), **Tasks** (placeholder), **Settings** (placeholder), 404
- [x] `lib/money.ts`: `parseAmount("1,250.50") → 125050`, `formatAmount(125050) → "₱1,250.50"` via `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`; reject negatives, zero, and more than 2 decimals
- [x] `lib/dates.ts`: `todayLocal()`, `monthKey`, `shiftMonth`, `isValidDate`, formatting (no `monthRange` needed: month queries use the `YYYY-MM-` prefix). **Never** use `toISOString().slice(0, 10)` for local dates: it's UTC, so in PH (UTC+8) anything logged before 8 AM lands on the previous day
- [x] Unit tests for `money.ts` and `dates.ts`
- [x] `.env.example` with `VITE_GOOGLE_CLIENT_ID`, `vercel.json` with the SPA rewrite
- [ ] Connect the repo to Vercel so every push deploys (deploy early; Phase 3 needs a real URL for OAuth)

### Done when
- `npm run build`, `npm run lint`, and the tests pass
- The shell is live on Vercel and refreshing on a deep route (e.g. `/settings`) doesn't 404
- Money and date utils are fully tested, including the edge cases above

---

## Phase 2: Budget, local only (v0.2)

**Goal:** the full v1 budget feature working offline in one browser, with no Google account involved.

### Tasks
- [x] `lib/schemas.ts`: Zod schemas for `Base`, `Entry`, `Category` (note max 80 chars, amount > 0 integer, `monthlyLimit` only on expense categories)
- [x] `lib/db.ts`: Dexie schema with `entries` (indexed by `date`, `categoryId`, `dirty`) and `categories`
- [x] **Dirty tracking now, not in Phase 3:** add a local-only `dirty: 0 | 1` field (Dexie can't index booleans), stripped before upload. Setting it from day one means no migration later
- [x] Data-access layer: `create`, `update`, `softDelete` that always set `updatedAt`, set `dirty`, and never hard-delete. All writes go through it
- [x] Seed default categories on first run with **fixed ids** (e.g. `default-expense-food`) so two devices that seed before their first sync don't end up with duplicate "Food" categories
- [x] Entry form: type toggle, amount (`inputmode="decimal"`), category, date (defaults to today), note; validated with Zod
- [x] Monthly view with month switcher
- [x] Summary card: income, spent, left (income − spent for the selected month)
- [x] Category budgets: set or clear `monthlyLimit`; progress bar with **near** at ≥ 80% and **over** at ≥ 100%
- [x] Entries list: newest first, delete (soft) with confirm or undo
- [x] Settings: manage categories (add, rename, reorder, set limit, soft-delete). Entries pointing at a deleted category still display
- [x] Zustand store for UI state (selected month, form state); reads from Dexie via live queries

### Done when
- You can use Annex as your real budget for a week in one browser
- Data survives reloads; deleted items are soft-deleted in IndexedDB
- Summary and budget numbers match a manual calculation, with all math in integer centavos

---

## Phase 3: Google sign-in and Drive sync (v0.3)

**Goal:** the same data on every device, owned by the user, without the UI ever waiting on the network.

### Tasks
- [ ] Pin the dev port in `vite.config.ts` (`server.port` + `strictPort`) so the OAuth origin is stable. Port 5173 is taken by another local project on this machine, so pick one (e.g. 5176, which `.claude/launch.json` already uses) and register that origin instead of `localhost:5173`
- [ ] Google Cloud setup per system.md: Drive API, consent screen (External, Testing), `drive.appdata` scope, OAuth Web client with the pinned localhost port and the Vercel URL as origins
- [ ] `sync/auth.ts`: load Google Identity Services, token client with `drive.appdata` only, token **in memory only**; on `401`, retry silently (`prompt: ''`), and show consent only if that fails; sign-out revokes the token
- [ ] `sync/drive.ts`: list (`spaces=appDataFolder`), get media, create (multipart, `parents: ['appDataFolder']`), update media. Cache name → file id
- [ ] `sync/merge.ts` as a **pure function** with thorough tests: newer `updatedAt` wins; deterministic tie-break on equal timestamps; a newer tombstone beats an older live copy; records that exist only on one side are kept
- [ ] `sync/engine.ts`
  - Pull: list files, fetch, **validate with Zod** (a failing file is never merged; surface an error), merge into Dexie
  - Push: rebuild only the files that contain dirty records, upload, then clear `dirty` only on records whose `updatedAt` didn't change during the upload (the user may have edited mid-sync)
  - Triggers: app load (pull then push), debounced push a few seconds after the last change, `visibilitychange` → hidden, **Sync now**
  - One sync at a time, including across tabs (Web Locks API: `navigator.locks.request('annex-sync', …)`)
  - Make it collection-agnostic (a registry of collections, each with a file strategy: single file or per-year) so v1.1 tasks and v1.2 sessions plug in without a rewrite
- [ ] Edge cases
  - **Duplicate files:** Drive allows two files with the same name; two devices syncing for the first time can both create `categories.json`. Merge all copies and delete the extras
  - **Entry moved to another year:** pull must read every `entries-*.json` and merge across them; when an entry's year changes, rebuild both the old and new year files so the stale copy drops out
  - **First sign-in with local data:** merge local into remote; never overwrite either side
- [ ] Sync status in the UI: signed out / syncing / synced at hh:mm / offline / error with a retry
- [ ] Decide sign-out behavior: keep local data, or offer "sign out and clear this device"

### Done when
- Two browsers (e.g. laptop + phone) on the same account converge after edits on both, including conflicting edits to the same entry and a delete on one vs. an edit on the other
- Leaving a tab open for over an hour, then editing, re-auths silently
- Clearing site data on one device and signing back in restores everything from Drive
- Merge tests cover every rule in system.md

---

## Phase 4: PWA and offline polish (v0.4)

**Goal:** an installable app that opens and works with no connection.

### Tasks
- [ ] `public/manifest.webmanifest` with icons, theme color, `display: standalone`
- [ ] Service worker that precaches the app shell (`vite-plugin-pwa` is the simplest route; it's not in system.md's stack)
- [ ] App loads offline; edits queue as dirty and sync on the `online` event (add it as a sync trigger)
- [ ] CSV export: date, type, category name, amount as a decimal, note; proper quoting; UTF-8 BOM so Excel shows ₱ correctly
- [ ] Tombstone purge for records deleted over 90 days ago, locally and in Drive
- [ ] Polish: empty states, loading skeletons, error toasts, focus styles, keyboard navigation, small-screen layout, color contrast

### Done when
- Installs on Android/desktop Chrome (and Add to Home Screen on iOS) and opens in airplane mode
- Offline edits sync automatically once back online
- Exported CSV opens cleanly in Excel and Google Sheets

---

## Phase 5: Budget release (v1.0)

**Goal:** a release you trust with real money data.

### Tasks
- [ ] Full QA pass on at least two real devices: the Phase 3 and 4 "done when" scenarios, plus month boundaries, year boundaries, and large amounts
- [ ] Error handling review: Drive quota/rate-limit errors, revoked access, invalid remote file
- [ ] Production env: `VITE_GOOGLE_CLIENT_ID` in Vercel, production URL in OAuth origins
- [ ] Decide the OAuth path: stay in **Testing** (≤ 100 named test users) or submit for Google verification to open sign-ups
- [ ] Lighthouse pass (performance, accessibility, PWA); check bundle size
- [ ] Bump `package.json` to `1.0.0`, tag the release, update the roadmap checkboxes in system.md

### Done when
- The QA checklist passes on two devices with no data loss
- v1.0.0 is tagged and live

---

## Phase 6: Tasks (v1.1)

**Goal:** the first half of Focus: a simple task manager on the same local-first sync.

### Tasks
- [ ] Define a `TaskList` type and where it's stored (system.md references `listId` but defines no list type; see Open questions)
- [ ] Zod schemas, Dexie schema **version bump** with migration, add `tasks` (and lists) to the sync registry
- [ ] Bump `schemaVersion` in `meta.json`; an older client that sees a newer `schemaVersion` should prompt the user to reload rather than sync
- [ ] Tasks screen: lists, add/edit/delete tasks, status `todo → doing → done`, optional estimate
- [ ] Filters (by list, by status) and ordering

### Done when
- Tasks sync across devices like budget data
- A v1.0 client and a v1.1 client on the same account don't corrupt each other's data

---

## Phase 7: Pomodoro timer and focus sessions (v1.2)

**Goal:** a timer that stays accurate in background tabs and across reloads, logging sessions per task.

### Tasks
- [ ] Timer state = `startedAt` + duration; remaining time is derived (`startedAt + duration − now`), never a ticking counter
- [ ] Running session persists as a `FocusSession` with no `endedAt` and is restored on reload
- [ ] Rule for a session found without `endedAt` after its planned end has passed (completed while closed vs. abandoned; see Open questions)
- [ ] Focus / short break / long break; pick a task to attach; complete, skip, abandon
- [ ] Notifications API at session end (ask permission on a user click), sound fallback; remaining time in the tab title
- [ ] `sessions-YYYY.json` in the sync registry
- [ ] Settings for durations and long-break interval

### Done when
- The timer is accurate to the second after backgrounding the tab for 25 minutes and after a reload mid-session
- Sessions show up per task and sync across devices

**Known limitation:** browsers throttle timers in hidden tabs, so the end-of-session notification can arrive a little late. The displayed time is always correct.

---

## Phase 8: Reports (v1.3)

**Goal:** simple insight into spending and focus.

### Tasks
- [ ] Reports route loaded with `React.lazy` so Recharts only ships in that chunk (confirm in the build output)
- [ ] Aggregations as pure, tested functions: spending by category per month, month-over-month totals, focus minutes per day and per task
- [ ] Charts plus a table fallback; date-range picker

### Done when
- Report totals match the budget and session data exactly
- The main bundle doesn't include Recharts

---

## Cross-cutting rules (every phase)

- Money in integer centavos; format only at display time
- Every write bumps `updatedAt` and goes through the data-access layer
- Soft-delete only; validate all external data with Zod
- Pure logic (money, dates, merge, aggregations) gets unit tests
- Keep features self-contained in `src/features/*`
- Each phase ends with lint, build, and tests green, deployed to Vercel

---

## Open questions

These are gaps or ambiguities in system.md worth settling before the phase that needs them.

| # | Question | Needed by | Suggested answer |
|---|---|---|---|
| 1 | Testing framework isn't in the stack | Phase 1 | Add **Vitest**; money and merge bugs are the costly ones |
| 2 | Tailwind v4 is CSS-first; `tailwind.config.ts` is optional | Phase 1 | **Settled:** tokens live in `src/index.css` (shadcn variables); no config file |
| 3 | Can entries be **edited**? Scope lists only delete | Phase 2 | **Settled:** Yes, tap an entry to edit; costs little and avoids delete-and-re-add |
| 4 | Can users add, rename, or delete categories? | Phase 2 | **Settled:** Yes, in Settings; soft-deleted categories still label old entries |
| 5 | Does "left" carry over unspent money between months? | Phase 2 | **Settled:** No, per month only, as written |
| 6 | Where is dirty state kept? Not in the data model | Phase 2 | **Settled:** Local-only `dirty` field, never uploaded |
| 7 | PWA plugin isn't in the stack | Phase 4 | Add `vite-plugin-pwa` |
| 8 | `listId` references a list type that isn't defined | Phase 6 | `TaskList = Base & { name; order }` in `lists.json` |
| 9 | How to tell a running session from an abandoned one? Is there pause? | Phase 7 | Past planned end with no `endedAt` → mark complete at the planned end; no pause in v1.2 |
| 10 | Where do timer settings live (local or synced)? | Phase 7 | Synced `settings.json`, so durations follow you across devices |
