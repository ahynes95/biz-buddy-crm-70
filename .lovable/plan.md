## CRM for a Digital Agency

A functional, multi-page CRM tailored to a full-service digital agency (web design, development, SEO, marketing, branding). Clean, minimal Apple-like design with light/dark theme toggle.

### Stack & infrastructure
- TanStack Start + React + Tailwind v4 + shadcn/ui (already present)
- Lovable Cloud for database, auth, and RLS
- Sidebar layout (shadcn `Sidebar`) for the authenticated app
- `next-themes` for light/dark theme switching

### Theme system
- Light, Dark, and System modes via a theme provider in `__root.tsx`
- Theme toggle button in the app header (sun/moon icon, dropdown for Light/Dark/System)
- Preference persisted in `localStorage`, no flash on load
- All colors defined as semantic oklch tokens in `src/styles.css` for both `:root` (light) and `.dark` — components only use semantic classes (`bg-background`, `text-foreground`, etc.)

### Auth
- Email + password sign-up / sign-in (`/login`, `/signup`)
- Auto-create row in `profiles` on signup (full name, avatar, role)
- All `/app/*` routes protected via `_authenticated` layout
- Separate `user_roles` table (`admin`, `member`) with `has_role()` security-definer function

### Core CRM modules

1. **Dashboard** (`/app`) — KPIs (open deal value, deals won this month, active projects, new leads), pipeline overview, recent activity, upcoming tasks
2. **Contacts** (`/app/contacts`) — list + search, detail page with linked deals/activity
3. **Companies** (`/app/companies`) — client/prospect orgs, linked contacts and deals
4. **Deals / Pipeline** (`/app/deals`) — Kanban with stages Lead → Qualified → Proposal → Negotiation → Won / Lost; service type, value, expected close
5. **Projects** (`/app/projects`) — created when a deal is Won; status, budget, timeline, tasks
6. **Activities** (`/app/activities`) — calls, emails, meetings, notes, tasks
7. **Settings** (`/app/settings`) — profile, theme, team management (admin), pipeline customization

### Database (Lovable Cloud)
Tables with RLS: `profiles`, `user_roles`, `companies`, `contacts`, `deals`, `projects`, `tasks`, `activities`. All have `created_by`, `created_at`, `updated_at`. FKs link contacts↔companies, deals↔contacts/companies, projects↔deals, tasks/activities↔deals/contacts/projects.

### Design
- Clean light & minimal as default, with full dark mode parity
- Generous whitespace, subtle borders, no heavy shadows
- Neutral palette + one accent (deep indigo)
- Inter for UI, tabular numerals for KPIs
- Sidebar: collapsible icon mode, active route highlighting

### Scope of this first build
Phase 1 (this implementation):
- Theme provider + light/dark toggle
- Auth + protected layout + sidebar shell
- DB schema with RLS
- Contacts (full CRUD), Companies (full CRUD), Deals (Kanban + CRUD)
- Dashboard with live KPIs

Phase 2 (follow-up): Projects, Tasks, Activities timeline, team management.

### Technical notes
- Server functions (`createServerFn` + `requireSupabaseAuth`) for all data reads/writes — no direct Supabase calls from components except auth
- TanStack Query with `ensureQueryData` in loaders under `_authenticated`
- Zod validation on every server function
- Drag-and-drop pipeline via `@dnd-kit/core`
