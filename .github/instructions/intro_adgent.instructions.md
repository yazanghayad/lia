# AGENTS.md — AI Agent Instructions for PraktikFinder

> Senast uppdaterad: 2026-02-13
> Läs hela detta dokument innan du gör NÅGON ändring.

---

## 1. Projektidentitet

**PraktikFinder** är en svensk matchningsplattform för praktikplatser. Studenter matchas med företag baserat på stad, praktiktyp (PRAO/APL/LIA/praktik), bransch och kompetenser. Skolor kan importera/hantera studenter. Admins övervakar hela ekosystemet.

**Språk i UI**: Svenska (menyer, labels, meddelanden, knappar). Kodkommentarer & variabelnamn: engelska.

---

## 2. Teknikstack — exakta versioner

| Lager | Teknologi | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.0.10 |
| Runtime | React | 19.2.0 |
| Språk | TypeScript (strict mode) | 5.7.2 |
| CSS | Tailwind CSS v4 | 4.x (`@import 'tailwindcss'`) |
| UI-bibliotek | shadcn/ui (New York style) | Radix-baserat |
| Autentisering | Clerk (+ Organizations + Billing) | 6.x |
| Databas | Appwrite (med Supabase-kompatibelt query-lager) | 18.x / node-appwrite 14.x |
| E-post | Resend | 6.x |
| AI Chat | NVIDIA API (Mistral) → fallback: keyword-baserat | — |
| Felhantering | Sentry | 9.x |
| State | Zustand 5.x (global), Nuqs (URL-state), React Hook Form + Zod (formulär) |
| Tabeller | TanStack Table | 8.x |
| Grafer | Recharts | 2.x |
| Drag & Drop | dnd-kit | 6.x |
| Pakethanterare | Bun (föredras) eller npm | — |

---

## 3. Mappstruktur & konventioner

```
src/
├── app/                    # Next.js App Router (routes)
│   ├── api/                # API-routes (serverless endpoints)
│   │   ├── admin/          # Admin-only: stats, export, matches
│   │   ├── chat/           # AI chatbot
│   │   ├── companies/      # CRUD + claim
│   │   ├── email/          # Resend send + webhooks
│   │   ├── matches/        # CRUD + bulk
│   │   ├── profiles/       # Användarens profil
│   │   ├── schools/        # CRUD + students
│   │   ├── students/       # CRUD + import + match
│   │   ├── waitlist/       # Väntelista
│   │   └── webhooks/       # Clerk webhooks (user.created/updated/deleted)
│   ├── auth/               # Clerk login/signup-sidor
│   ├── dashboard/          # Dashboard med sidebar-layout
│   │   ├── overview/       # Parallel routes: @area_stats, @bar_stats, @pie_stats, @sales
│   │   ├── product/        # Student-lista (legacy-namn, avser "Studenter")
│   │   ├── kanban/         # Matchnings-board (dnd-kit)
│   │   ├── profile/        # Clerk-profil ([[...profile]])
│   │   ├── workspaces/     # Clerk Organizations
│   │   ├── billing/        # Clerk Billing
│   │   └── exclusive/      # Proplan-exklusivt
│   ├── about/              # Om-sida
│   ├── privacy-policy/     # Integritetspolicy
│   └── terms-of-service/   # Användarvillkor
│
├── features/               # Affärslogik grupperad per feature
│   ├── auth/               # Auth-formulär (sign-in, sign-up)
│   ├── overview/           # Dashboard-grafer (area, bar, pie, recent-sales)
│   ├── products/           # Student-tabell med cell-actions
│   ├── kanban/             # Kanban-board (Zustand store + dnd-kit)
│   └── profile/            # Profil-formulär + schema
│
├── components/
│   ├── ui/                 # shadcn/ui-komponenter — REDIGERA INTE DIREKT
│   ├── layout/             # app-sidebar, header, providers, info-sidebar
│   ├── forms/              # Generiska formulärkomponenter
│   ├── themes/             # Temasystem (6 inbyggda teman)
│   ├── kbar/               # Cmd+K sökbar
│   ├── ai-chatbot.tsx      # AI-chatbot widget
│   ├── icons.tsx           # Ikonregistret (Tabler icons)
│   ├── nav-main.tsx        # Sidebar-navigation
│   ├── org-switcher.tsx    # Clerk Organization-switcher
│   └── ...
│
├── config/
│   ├── nav-config.ts       # Navigation-items med RBAC-access
│   ├── data-table.ts       # Data-tabell-konfiguration
│   └── infoconfig.ts       # Sidebar info-panel config
│
├── hooks/                  # Custom hooks
│   ├── use-nav.ts          # RBAC-filtrering av navigation (client-side)
│   ├── use-data-table.ts   # TanStack Table-integration
│   ├── use-multistep-form.tsx
│   └── ...
│
├── lib/
│   ├── appwrite/
│   │   ├── server.ts       # HUVUDFIL: Supabase-kompatibelt query-lager över Appwrite
│   │   └── client.ts       # Browser-klient (Account, Databases)
│   ├── utils.ts            # cn() + formatBytes()
│   ├── data-table.ts       # Hjälpfunktioner för tabeller
│   ├── format.ts           # Datumformatering etc.
│   ├── parsers.ts          # URL searchparam-parsers
│   └── searchparams.ts     # Sökvarshjälpare
│
├── types/
│   ├── index.ts            # NavItem, PermissionCheck
│   ├── database.ts         # Profile, Student, Company, School, Match, Database
│   ├── data-table.ts       # Tabelltyper
│   └── base-form.ts        # Formulärbastyper
│
├── constants/
│   ├── data.ts             # Mockdata (recentMatches etc.) — SVENSKA namn
│   └── mock-api.ts         # Fake product-API (legacy)
│
└── styles/
    ├── globals.css          # Tailwind-import + view transitions
    ├── theme.css            # Tema-importer
    └── themes/              # Individuella .css per tema (6 st)
```

---

## 4. Roller & behörighetsmodell

Fyra roller: `student`, `company`, `school`, `admin`

| Resurs | Student | Företag | Skola | Admin |
|---|---|---|---|---|
| Egen profil | CRUD | CRUD | CRUD | CRUD |
| Se matchningar | Egna | Egna | Alla (sin skola) | Alla |
| Visa intresse | ✅ | ✅ | ❌ | ✅ |
| Se alla studenter | ❌ | Matchade | Skolans | Alla |
| Se alla företag | ✅ | ❌ | ✅ | Alla |
| Importera studenter (CSV) | ❌ | ❌ | ✅ | ✅ |
| Manuell matchning | ❌ | ❌ | ✅ | ✅ |
| Exportera data | ❌ | ❌ | ✅ | ✅ |
| Systemkonfiguration | ❌ | ❌ | ❌ | ✅ |
| Skicka email (Resend) | ❌ | ❌ | ❌ | ✅ |

**Rollkontroll sker i:**
- API-routes: `auth()` → profiltabell `role`-fält (server-side)
- Navigation: `useFilteredNavItems()` hook med Clerk `access`-properties (client-side, UX only)
- Sidor: Clerk `<Protect>` eller `has()` för plan/feature-gating

---

## 5. Databasarkitektur (Appwrite)

### Supabase-kompatibelt lager
`src/lib/appwrite/server.ts` exponerar ett Supabase-liknande API:
```ts
const supabase = await createClient();
const { data, error } = await supabase
  .from('students')
  .select('*, schools(name)')
  .eq('city', 'Stockholm')
  .order('created_at', { ascending: false })
  .limit(10);
```
Stöder: `.select()`, `.insert()`, `.update()`, `.delete()`, `.upsert()`, `.eq()`, `.neq()`, `.ilike()`, `.gt()`, `.gte()`, `.lte()`, `.in()`, `.range()`, `.limit()`, `.order()`, `.single()`, `{ count: 'exact' }`.

**ILIKE-filter kräver fulltext-index i Appwrite.**

### Collections (7 st)
| Collection | Nyckelattribut |
|---|---|
| `profiles` | id (=Clerk userId), role, email, full_name, avatar_url |
| `students` | user_id, school_id, full_name, email, city, practice_type, program, status |
| `companies` | user_id, name, org_number, city, industry, accepts_prao/apl/lia/praktik, available_spots, is_claimed, is_verified |
| `schools` | user_id, name, school_code, city, contact_email, is_verified |
| `matches` | student_id, company_id, status, match_score, matched_by |
| `waitlist` | email, role, company_name, school_name, city |
| `email_logs` | recipient, template, status |

### Setup-script
```bash
npx tsx scripts/setup-appwrite.ts
```
Skapar databas, collections, attribut och fulltext-index.

---

## 6. API-routes — komplett referens

| Endpoint | Metoder | Auth | Roll | Beskrivning |
|---|---|---|---|---|
| `/api/profiles` | GET, POST, PATCH | Clerk | Alla | Aktuell användares profil |
| `/api/students` | GET, POST | Clerk | Admin/skola/företag* | Lista/skapa studenter |
| `/api/students/[id]` | GET, PATCH, DELETE | Clerk | Varies | Enskild student |
| `/api/students/import` | POST | Clerk | Skola/admin | CSV-import av studenter |
| `/api/students/match` | POST | Clerk | Alla | Hitta matchningar för student |
| `/api/companies` | GET, POST | Clerk | Alla | Lista/skapa företag |
| `/api/companies/[id]` | GET, PATCH, DELETE | Clerk | Varies | Enskilt företag |
| `/api/companies/claim` | POST | Clerk | Alla | Claima förregistrerat företag |
| `/api/schools` | GET, POST | Clerk | Alla | Lista/skapa skolor |
| `/api/schools/[id]` | GET, PATCH, DELETE | Clerk | Varies | Enskild skola |
| `/api/schools/[id]/students` | GET, POST | Clerk | Skola/admin | Studenter på skolan |
| `/api/matches` | GET, POST | Clerk | Alla | Lista/skapa matchningar |
| `/api/matches/[id]` | GET, PATCH, DELETE | Clerk | Varies | Enskild matchning |
| `/api/matches/bulk` | POST | Clerk | Admin | Massåtgärder |
| `/api/admin/stats` | GET | Clerk | Admin | Dashboard-statistik |
| `/api/admin/export` | GET | Clerk | Admin | Exportera data (JSON/CSV) |
| `/api/admin/matches` | GET, POST, PATCH | Clerk | Admin | Admin-matchningshantering |
| `/api/chat` | POST | Clerk | Alla | AI-chatbot (NVIDIA/fallback) |
| `/api/email/send` | POST | Clerk | Admin | Skicka e-post (Resend) |
| `/api/email/webhooks` | POST | — | Resend webhook | E-postleveransstatus |
| `/api/waitlist` | GET, POST | Valfri | Alla | Väntelista |
| `/api/webhooks/clerk` | POST | Svix | Clerk | Synk: user.created/updated/deleted |

**Mönster i alla routes:**
```ts
import { createClient } from '@/lib/appwrite/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = await createClient();
  // ... query med supabase-kompatibelt API
}
```

---

## 7. Matchningsalgoritm

Poängsystem (0–100):
- **Stad** (40p): Exakt match
- **Praktiktyp** (35p): Student practice_type vs company accepts_X
- **Bransch** (25p): Student preferred_industries ∩ company industry

Tröskel: `min_score = 50` (konfigurerbart)

Implementerad i: `/api/students/match/route.ts`

---

## 8. Kodkonventioner — STRIKT

### TypeScript
- **Strict mode** — inga `any`; explicit returttyper på publika funktioner
- **Interface framför type** för objekt
- **Imports**: `@/*` = `src/*`, `~/*` = `public/*`
- Alla databastyper i `src/types/database.ts`
- Alla nav-typer i `src/types/index.ts`

### Komponenter
- **Server Components by default** — lägg BARA till `'use client'` vid browser-API:er/hooks
- Funktionsdeklarationer: `function ComponentName() {}` (inte arrow)
- Props: `interface ComponentNameProps {}`
- Klassnamn: ALLTID `cn()` från `@/lib/utils` — ALDRIG strängkonkatenering
- **REDIGERA INTE `src/components/ui/`** — extenda istället

### Formulär
- React Hook Form + Zod för validering
- Generiska fältkomponenter i `src/components/forms/`

### Formattering (Prettier)
```json
{
  "singleQuote": true,
  "jsxSingleQuote": true,
  "semi": true,
  "trailingComma": "none",
  "tabWidth": 2,
  "arrowParens": "always"
}
```

---

## 9. Autentisering & sessioner

- **Clerk** hanterar all autentisering
- Webhooks via Svix (CLERK_WEBHOOK_SECRET) synkar user → `profiles`-collection
- Roll sätts via `public_metadata.role` vid registrering (default: `'student'`)
- Keyless mode fungerar utan API-nycklar i development

### Skyddade routes
```ts
// Server-side
const { userId } = await auth();
if (!userId) redirect('/auth/sign-in');

// Roll-check
const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
```

---

## 10. Externa tjänster

| Tjänst | Syfte | Env-variabel |
|---|---|---|
| Clerk | Auth, Users, Organizations, Billing | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| Appwrite | Databas (collections), ev. Storage | `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID` |
| Resend | E-postutskick | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| NVIDIA API | AI-chat (Mistral LLM) | `NVIDIA_API_KEY` |
| Sentry | Felhantering & monitoring | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` |

---

## 11. Feature-moduler — var lägger man ny kod?

### Ny sida
1. Skapa route: `src/app/dashboard/ny-sida/page.tsx`
2. Lägg till i navigation: `src/config/nav-config.ts`
3. Feature-logik: `src/features/ny-feature/components/` + `utils/`

### Ny API-route
1. Skapa: `src/app/api/ny-resurs/route.ts`
2. Följ befintligt mönster: auth → createClient → query → response
3. Admin-skydd med `isAdmin()`-helper om nödvändigt

### Ny databastyp
1. Lägg till interface i `src/types/database.ts`
2. Lägg till i `Database.public.Tables`
3. Lägg till collection-mapping i `lib/appwrite/server.ts` → `COLLECTIONS`

### Ny shadcn-komponent
```bash
npx shadcn add <komponent>
```

### Nytt tema
1. Skapa `src/styles/themes/mitt-tema.css` med `[data-theme='mitt-tema']`
2. Importera i `src/styles/theme.css`
3. Lägg till i `THEMES` i `src/components/themes/theme.config.ts`

---

## 12. Kända tillstånd & begränsningar

### Delvis implementerat
- **Dashboard overview**: Visar mockdata-grafer, inte live-data från Appwrite
- **Products/Student-tabell**: Använder `fakeProducts` mock-API, bör kopplas mot `/api/students`
- **Kanban**: Funktionell drag-and-drop men använder lokal Zustand-store, ej persisterat
- **Profil**: Clerk-hanterad, ingen koppling till `profiles`-collection i UI
- **AI Chatbot**: Fungerar med NVIDIA eller keyword-fallback

### Saknas helt (planerat i planfil.md)
- Roll-specifika dashboards (student/company/school-views)
- Meddelandesystem (konversationer, realtime)
- Notifikationssystem
- Företags-dashboard (placements, applicants, analytics)
- Skol-dashboard (classes, CSV-import UI, reports)
- Student-dashboard (matches-lista, ansökningar)
- Google Maps/kartor-integration
- LinkedIn-integration

### Legacy-namngivning
- `/dashboard/product/` → avser "Studenter" (behåller routes av kompatibilitetsskäl)
- `features/products/` → student-tabellkomponenter
- `mock-api.ts` → `fakeProducts` = mock-studenter, inte produkter
- `recentSalesData` → alias för `recentMatchesData`

---

## 13. Utvecklingskommandon

```bash
# Installera beroenden
bun install          # eller npm install

# Starta dev
bun run dev          # → http://localhost:3000

# Bygg
bun run build

# Lint & format
bun run lint         # ESLint
bun run lint:fix     # ESLint fix + format
bun run format       # Prettier

# Appwrite setup
npx tsx scripts/setup-appwrite.ts
```

---

## 14. Checklista vid kodändringar

- [ ] Typerna i `src/types/database.ts` matchar Appwrite-collections
- [ ] Ny collection? Lägg till i `COLLECTIONS` i `lib/appwrite/server.ts`
- [ ] Ny navigation? Uppdatera `src/config/nav-config.ts` med rätt `access`
- [ ] API-route? Auth-check + roll-check + felhantering
- [ ] Formulär? Zod-schema + React Hook Form
- [ ] UI-text? Svenska
- [ ] Klassnamn? `cn()` — inte string-concat
- [ ] Server component? Ta inte in `'use client'` i onödan
- [ ] Ingen `any`
- [ ] Kör `bun run lint` innan commit

---

## 15. Guiding principles

1. **Följ befintliga mönster** — titta på liknande filer innan du skapar nya
2. **Feature-baserad struktur** — all ny affärslogik i `src/features/`
3. **Server-first** — server components som default, client bara vid behov
4. **Typsäkerhet** — explicit types, inget `any`, validera med Zod
5. **Supabase-kompatibelt** — alla DB-queries via `createClient()` → `.from()` kedja
6. **RBAC** — server-side auth i API-routes, client-side i navigation
7. **Svenska UI** — all synlig text, knappar, labels, errors på svenska
8. **Extenda, inte modifiera** — `src/components/ui/` ändras inte
9. **Enkel felhantering** — try/catch i varje API-route, tydliga error-responses
10. **Mockdata → live** — gradvis ersätta `fakeProducts`/`recentSalesData` med Appwrite-data
11. **Dokumentera allt** — lägg till kommentarer i koden, håll denna guide uppdaterad
12. **Testa manuellt** — kör alltid igenom flöden i UI efter ändringar
13. **Kommunicera** — tveka inte att diskutera större ändringar   med teamet innan implementation 
14. **Säkerhet först** — skydda alla routes, särskilt admin-funktioner
15. **Prestanda** — optimera DB-queries, undvik onödiga
renderingar i React, använd memoization där det behövs
16. **Skalbarhet** — tänk på hur nya features kommer att passa in
i den befintliga strukturen, undvik att skapa "spaghetti code"
17. **Använd externa tjänster smart** — utnyttja Clerk, Appwrite, Resend fullt ut istället för att bygga egna lösningar
18. **Håll det enkelt** — implementera bara det som behövs, undvik överkomplexa lösningar för nuvarande krav
19. **Följ kodkonventioner** — strikt TypeScript, server components,            `cn()` för klassnamn, svenska i UI
20. **Var noggrann** — dubbelkolla alla ändringar, särskilt i
API-routes och databasinteraktioner, för att undvika buggar och säkerhetsproblem
21. **Håll dig uppdaterad** — läs hela denna guide innan du gör ändringar, och håll den uppdaterad med nya lärdomar och ändringar i projektet
