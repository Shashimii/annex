# Annex

A personal space to check in with yourself: track your money today, and your focus tomorrow.

Annex is a client-side web app. Every user's data lives in **their own Google Drive**, so there is no server database, no hosting cost for data, and the user owns everything they record.

> Built by **Shashimii**.

---

## Scope

### v1: Budget
- Log **income** and **expenses** with amount, category, date and an optional note
- **Monthly view** with month switching
- **Summary**: income, spent, and what's left this month
- **Category budgets**: a monthly limit per category with progress (near at 80%, over at 100%)
- **Entries list**: newest first, with delete
- Currency: **Philippine peso (₱)**

### v2: Focus (planned)
- **Tasks** with lists and status
- **Pomodoro timer** (focus / short break / long break) tied to a task
- **Focus sessions** logged per task
- Simple reports: focus time per day and per task

### Out of scope (for now)
- Multi-currency
- Shared or family budgets
- Bank or e-wallet integrations

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Build | **Vite** | Fast dev server, small bundles, no server layer |
| UI | **React + TypeScript** | Simple codebase; types protect money math and timer state |
| Styling | **Tailwind CSS** | Annex's design tokens live in one config |
| Routing | **React Router** | A few screens: Budget, Tasks, Settings |
| State | **Zustand** | Tiny store for UI, sync status and timer state |
| Local storage | **Dexie** (IndexedDB) | Instant reads/writes, works offline |
| Cloud storage | **Google Drive API v3** (`drive.appdata`) | User-owned data, hidden app folder |
| Auth | **Google Identity Services** | Browser-only OAuth token flow |
| Validation | **Zod** | Validate forms and every file read from Drive |
| Charts (later) | **Recharts** | Loaded only on the reports screen |
| Hosting | **Vercel** | Static deploy from GitHub |

---

## Architecture

```
 UI (React)
   │  reads/writes instantly
   ▼
 Local DB (Dexie / IndexedDB)  ◄── source of truth on this device
   │  background sync (debounced)
   ▼
 Sync engine ── merge by id + updatedAt
   │
   ▼
 Google Drive appDataFolder  ◄── source of truth across devices
```

**Local-first.** The UI never waits on the network. Every change is saved to IndexedDB immediately and marked dirty. The sync engine pushes and pulls in the background.

### When sync runs
- On app load (pull, then push)
- A few seconds after the last change (debounced push)
- When the tab is hidden or closed (`visibilitychange`)
- When the user taps **Sync now**

### Merge rule
Records are merged **per record**, never by overwriting a whole file:
1. Index local and remote records by `id`.
2. For each `id`, keep the version with the newer `updatedAt`.
3. Deletions are **soft** (`deletedAt` set) so a delete on one device wins over a stale copy on another. Tombstones older than 90 days can be purged.

### Auth notes
- Scope: `https://www.googleapis.com/auth/drive.appdata` only.
- Access tokens last about **1 hour** and the browser flow has no refresh token. On a `401`, request a new token silently (`prompt: ''`); only show the consent screen if that fails.
- Tokens are kept **in memory only**, never in localStorage.
- While the OAuth app is in **Testing** mode, only added test users (max 100) can sign in. Publishing requires Google verification.

---

## Data model

All money is stored as **integer centavos** (`₱1,250.50` → `125050`). Never use floats for amounts. All dates are `YYYY-MM-DD` strings in the user's local time; timestamps are ISO strings.

Every record shares these fields:

```ts
type Base = {
  id: string;          // crypto.randomUUID()
  createdAt: string;   // ISO timestamp
  updatedAt: string;   // ISO timestamp, bumped on every change
  deletedAt?: string;  // soft delete
};
```

### v1

```ts
type Entry = Base & {
  type: 'income' | 'expense';
  amount: number;      // centavos, > 0
  categoryId: string;
  date: string;        // YYYY-MM-DD
  note?: string;       // max 80 chars
};

type Category = Base & {
  name: string;
  kind: 'income' | 'expense';
  monthlyLimit?: number; // centavos, expense categories only
  order: number;
};
```

Default expense categories: Food, Transport, Bills, Rent, Shopping, Health, Fun, Other.
Default income categories: Salary, Side income, Gift, Other income.

### v2 (planned)

```ts
type Task = Base & {
  title: string;
  listId?: string;
  status: 'todo' | 'doing' | 'done';
  estimateMinutes?: number;
};

type FocusSession = Base & {
  taskId?: string;
  kind: 'focus' | 'short_break' | 'long_break';
  startedAt: string;   // ISO
  plannedMinutes: number;
  endedAt?: string;    // ISO; missing = abandoned or running
};
```

### Files in Drive (`appDataFolder`)

| File | Contents |
|---|---|
| `meta.json` | `{ schemaVersion, lastSyncedAt }` |
| `categories.json` | `Category[]` |
| `entries-YYYY.json` | `Entry[]` for that year |
| `tasks.json` | `Task[]` (v2) |
| `sessions-YYYY.json` | `FocusSession[]` for that year (v2) |

Splitting by year keeps each upload small. Every file is validated with Zod on read; a file that fails validation is never merged.

---

## Timer rules (v2)

- The timer stores a **start timestamp and duration**, never a ticking counter. Remaining time = `startedAt + duration - now`.
- This keeps it accurate when the tab is in the background and the browser throttles timers.
- A running session survives a page reload (restored from the store).
- Use the **Notifications API** to signal the end of a session, with a sound as fallback.

---

## Project structure

```
annex/
├── public/
│   └── manifest.webmanifest
├── src/
│   ├── app/              # App shell, router, providers
│   ├── features/
│   │   ├── budget/       # Entries, categories, summary, budgets
│   │   └── focus/        # Tasks, timer, sessions (v2)
│   ├── lib/
│   │   ├── db.ts         # Dexie schema
│   │   ├── money.ts      # centavos <-> display, parsing
│   │   ├── dates.ts      # month keys, local dates
│   │   └── schemas.ts    # Zod schemas
│   ├── sync/
│   │   ├── auth.ts       # Google Identity Services token client
│   │   ├── drive.ts      # Drive REST calls (list, get, create, update)
│   │   ├── merge.ts      # per-record merge
│   │   └── engine.ts     # scheduling, dirty tracking, status
│   ├── store/            # Zustand stores
│   ├── components/       # Shared UI
│   ├── styles/
│   │   └── index.css     # Tailwind entry
│   └── main.tsx
├── .env.example
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

---

## Getting started

### Requirements
- Node.js 20+
- A Google Cloud project with the **Google Drive API** enabled
- An **OAuth 2.0 Client ID** (type: Web application)

### Google Cloud setup
1. Create a project in Google Cloud Console.
2. Enable **Google Drive API**.
3. Configure the **OAuth consent screen** (External, Testing) and add yourself as a test user.
4. Add the scope `.../auth/drive.appdata`.
5. Create an **OAuth Client ID** (Web application) and add authorized JavaScript origins:
   - `http://localhost:5173`
   - your Vercel URL

### Environment

```bash
cp .env.example .env
```

```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

The client ID is public by design. There are no secrets in this app.

### Run

```bash
npm install
npm run dev
```

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint the codebase |

---

## Deploy

Deploy to Vercel by importing the GitHub repo. Vercel detects Vite automatically.

Add `vercel.json` so client-side routes survive a refresh:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Set `VITE_GOOGLE_CLIENT_ID` in the Vercel project's environment variables, and add the production URL to the OAuth client's authorized origins.

---

## Roadmap

- [ ] **v0.1**: Project scaffold, design tokens, app shell
- [ ] **v0.2**: Budget with local storage only (entries, categories, limits, monthly view)
- [ ] **v0.3**: Google sign-in and Drive sync
- [ ] **v0.4**: PWA install, offline polish, export to CSV
- [ ] **v1.0**: Budget release
- [ ] **v1.1**: Tasks
- [ ] **v1.2**: Pomodoro timer and focus sessions
- [ ] **v1.3**: Reports (spending and focus)

---

## Conventions

- Money: integer centavos everywhere; format only at display time with `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`.
- Never mutate a record without bumping `updatedAt`.
- Never hard-delete a synced record; set `deletedAt`.
- Validate all external data (Drive files, form input) with Zod.
- Keep features self-contained in `src/features/*`.