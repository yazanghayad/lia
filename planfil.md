# PraktikFinder - Teknisk Arkitektur & Funktionsplan

## Systemöversikt

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 14)                     │
├─────────────────────────────────────────────────────────────────┤
│  Landing Page    │   Auth Pages    │   Dashboard (Rollbaserad)  │
│  ─────────────   │   ──────────    │   ─────────────────────    │
│  • Hero          │   • Sign In     │   • Student Dashboard      │
│  • Features      │   • Sign Up     │   • Company Dashboard      │
│  • Pricing       │   • Verify      │   • School Dashboard       │
│  • Contact       │   • Reset PW    │   • Admin Dashboard        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER (Next.js API Routes)            │
├─────────────────────────────────────────────────────────────────┤
│  /api/auth/*     │  /api/users/*   │  /api/matching/*           │
│  /api/students/* │  /api/companies/*│  /api/schools/*           │
│  /api/messages/* │  /api/notifications/*│  /api/admin/*         │
│  /api/chat/*     │  /api/export/*  │  /api/webhooks/*           │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌───────────────────┐ ┌───────────────┐ ┌───────────────────┐
│   Clerk Auth      │ │   Supabase    │ │   External APIs   │
│   ────────────    │ │   ─────────   │ │   ─────────────   │
│   • Sessions      │ │   • PostgreSQL│ │   • NVIDIA AI     │
│   • Users         │ │   • Storage   │ │   • Resend Email  │
│   • Organizations │ │   • Realtime  │ │   • Google Maps   │
│   • Webhooks      │ │   • Edge Func │ │   • LinkedIn      │
└───────────────────┘ └───────────────┘ └───────────────────┘
```

---

## Roller & Behörighetsmatris

| Funktion | Student | Företag | Skola | Admin |
|----------|---------|---------|-------|-------|
| Se egen profil | ✅ | ✅ | ✅ | ✅ |
| Redigera egen profil | ✅ | ✅ | ✅ | ✅ |
| Se matchningar | ✅ | ✅ | ✅ | ✅ |
| Skicka intresse | ✅ | ✅ | ❌ | ✅ |
| Skicka meddelanden | ✅ | ✅ | ✅ | ✅ |
| Se alla studenter | ❌ | 🔶* | ✅ | ✅ |
| Se alla företag | ✅ | ❌ | ✅ | ✅ |
| Importera studenter | ❌ | ❌ | ✅ | ✅ |
| Manuell matchning | ❌ | ❌ | ✅ | ✅ |
| Exportera data | ❌ | ❌ | ✅ | ✅ |
| Systemkonfiguration | ❌ | ❌ | ❌ | ✅ |
| Ta bort användare | ❌ | ❌ | ❌ | ✅ |

*🔶 = Endast matchade studenter

---

## 🎓 STUDENT - Detaljerad Specifikation

### Datamodell
```typescript
interface Student {
  id: string;
  userId: string;                    // Clerk user ID
  
  // Personuppgifter
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  
  // Praktikinfo
  internshipType: 'prao' | 'apl' | 'lia' | 'internship';
  city: string;
  preferredIndustries: string[];     // ['IT', 'Fintech', 'Gaming']
  skills: string[];                  // ['JavaScript', 'Python', 'React']
  
  // Skolkoppling
  schoolId?: string;
  className?: string;
  program?: string;
  graduationYear?: number;
  
  // CV & Portfolio
  cvUrl?: string;
  portfolioUrl?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  
  // Preferenser
  startDate?: Date;
  endDate?: Date;
  remotePreference: 'onsite' | 'remote' | 'hybrid';
  
  // Status
  status: 'searching' | 'matched' | 'placed' | 'completed' | 'inactive';
  visibility: 'public' | 'school_only' | 'hidden';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}
```

### Student Dashboard - Komponenter

```
/dashboard/student/
├── page.tsx                    # Översikt
│   ├── StatsCards              # Matchningar, visningar, intresse
│   ├── RecentMatches           # Senaste 5 matchningar
│   ├── UpcomingDeadlines       # Praktikperiod-deadlines
│   └── QuickActions            # Uppdatera profil, se alla matchningar
│
├── matches/
│   ├── page.tsx                # Alla matchningar
│   │   ├── MatchFilters        # Filtrera på stad, bransch, typ
│   │   ├── MatchList           # Lista med matchpoäng
│   │   └── MatchCard           # Företagsinfo, kontakt-knapp
│   │
│   └── [companyId]/
│       └── page.tsx            # Företagsdetaljer
│           ├── CompanyHeader   # Logo, namn, bransch
│           ├── CompanyInfo     # Beskrivning, adress
│           ├── Placements      # Tillgängliga platser
│           └── ActionButtons   # Visa intresse, kontakta
│
├── profile/
│   ├── page.tsx                # Profilöversikt
│   │   ├── ProfileHeader       # Foto, namn, status
│   │   ├── ProfileCompletion   # Procentuell progress
│   │   └── ProfileSections     # CV, skills, preferenser
│   │
│   └── edit/
│       └── page.tsx            # Redigera profil
│           ├── PersonalInfoForm
│           ├── InternshipPrefsForm
│           ├── SkillsSelector
│           ├── CVUploader
│           └── PortfolioLinks
│
├── messages/
│   ├── page.tsx                # Meddelandelista
│   │   ├── ConversationList    # Alla konversationer
│   │   └── UnreadBadge         # Antal olästa
│   │
│   └── [conversationId]/
│       └── page.tsx            # Enskild konversation
│           ├── MessageThread   # Meddelandehistorik
│           └── MessageInput    # Skicka nytt meddelande
│
└── applications/
    └── page.tsx                # Mina ansökningar
        ├── ApplicationList     # Alla ansökningar
        ├── ApplicationCard     # Status, datum, företag
        └── ApplicationStatus   # Väntar, accepterad, nekad
```

### Student API Endpoints

```typescript
// CRUD
GET    /api/students                    // Lista (admin/skola)
GET    /api/students/me                 // Hämta egen profil
POST   /api/students                    // Skapa profil
PATCH  /api/students/me                 // Uppdatera egen profil
DELETE /api/students/me                 // Ta bort konto

// Matchningar
GET    /api/students/me/matches         // Hämta matchningar
GET    /api/students/me/matches/stats   // Matchningsstatistik

// Intresse & Ansökningar
POST   /api/students/me/interests       // Visa intresse för företag
GET    /api/students/me/interests       // Lista intressen
DELETE /api/students/me/interests/:id   // Ta bort intresse

POST   /api/students/me/applications    // Skicka ansökan
GET    /api/students/me/applications    // Lista ansökningar

// Filer
POST   /api/students/me/cv              // Ladda upp CV
DELETE /api/students/me/cv              // Ta bort CV
```

---

## 🏢 FÖRETAG - Detaljerad Specifikation

### Datamodell
```typescript
interface Company {
  id: string;
  userId: string;                       // Clerk user ID (admin)
  
  // Företagsinfo
  name: string;
  organizationNumber: string;           // Org.nr
  industry: string;                     // Bransch
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  
  // Kontakt
  email: string;
  phone?: string;
  website?: string;
  
  // Adress
  street: string;
  city: string;
  postalCode: string;
  coordinates?: { lat: number; lng: number };
  
  // Beskrivning
  description: string;
  culture?: string;                     // Företagskultur
  benefits?: string[];                  // Förmåner
  
  // Praktik
  internshipTypes: ('prao' | 'apl' | 'lia' | 'internship')[];
  remotePolicy: 'onsite' | 'remote' | 'hybrid';
  
  // Bilder
  logo?: string;
  coverImage?: string;
  officeImages?: string[];
  
  // Status
  status: 'pending' | 'verified' | 'active' | 'inactive';
  claimedAt?: Date;
  verifiedAt?: Date;
  
  // Medlemmar
  members: CompanyMember[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface CompanyMember {
  userId: string;
  role: 'owner' | 'admin' | 'recruiter' | 'viewer';
  email: string;
  name: string;
  addedAt: Date;
}

interface Placement {
  id: string;
  companyId: string;
  
  // Info
  title: string;
  description: string;
  internshipType: 'prao' | 'apl' | 'lia' | 'internship';
  
  // Krav
  requiredSkills?: string[];
  preferredSkills?: string[];
  
  // Period
  startDate?: Date;
  endDate?: Date;
  durationWeeks?: number;
  
  // Kapacitet
  spotsTotal: number;
  spotsFilled: number;
  
  // Status
  status: 'draft' | 'active' | 'filled' | 'closed';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### Company Dashboard - Komponenter

```
/dashboard/company/
├── page.tsx                    # Översikt
│   ├── StatsCards              # Platser, sökande, matchningar
│   ├── RecentApplicants        # Senaste ansökningar
│   ├── PlacementsSummary       # Status per plats
│   └── QuickActions            # Skapa plats, se sökande
│
├── placements/
│   ├── page.tsx                # Alla praktikplatser
│   │   ├── PlacementFilters    # Status, typ
│   │   ├── PlacementList       # Lista med platser
│   │   └── CreateButton        # Skapa ny plats
│   │
│   ├── create/
│   │   └── page.tsx            # Skapa praktikplats
│   │       ├── PlacementForm   # Titel, beskrivning
│   │       ├── RequirementsPicker
│   │       ├── DateRangePicker
│   │       └── SpotsInput
│   │
│   └── [placementId]/
│       ├── page.tsx            # Platsdetaljer
│       │   ├── PlacementHeader
│       │   ├── ApplicantsList  # Sökande till denna plats
│       │   └── PlacementActions
│       │
│       └── edit/
│           └── page.tsx        # Redigera plats
│
├── applicants/
│   ├── page.tsx                # Alla sökande
│   │   ├── ApplicantFilters    # Status, plats, datum
│   │   ├── ApplicantTable      # Tabell med sökande
│   │   └── BulkActions         # Massåtgärder
│   │
│   └── [studentId]/
│       └── page.tsx            # Studentdetaljer
│           ├── StudentProfile  # CV, skills, portfolio
│           ├── MatchScore      # Matchningspoäng
│           └── ActionButtons   # Acceptera, avvisa, kontakta
│
├── profile/
│   ├── page.tsx                # Företagsprofil
│   │   ├── CompanyHeader       # Logo, namn
│   │   ├── CompanyInfo         # Beskrivning
│   │   └── PublicPreview       # Hur studenter ser er
│   │
│   └── edit/
│       └── page.tsx            # Redigera profil
│           ├── BasicInfoForm
│           ├── LogoUploader
│           ├── InternshipSettings
│           └── TeamMembers
│
├── messages/
│   └── ...                     # Samma struktur som student
│
└── analytics/
    └── page.tsx                # Statistik
        ├── ViewsChart          # Profilvisningar över tid
        ├── ApplicationsChart   # Ansökningar per månad
        └── ConversionMetrics   # Matchning → Placering
```

### Company API Endpoints

```typescript
// CRUD
GET    /api/companies                       // Lista alla (public)
GET    /api/companies/:id                   // Företagsdetaljer
POST   /api/companies                       // Registrera företag
PATCH  /api/companies/:id                   // Uppdatera
DELETE /api/companies/:id                   // Ta bort

// Claim & Verifiering
POST   /api/companies/claim                 // Claima befintligt
POST   /api/companies/:id/verify            // Verifiera (admin)

// Praktikplatser
GET    /api/companies/:id/placements        // Lista platser
POST   /api/companies/:id/placements        // Skapa plats
PATCH  /api/companies/:id/placements/:pid   // Uppdatera plats
DELETE /api/companies/:id/placements/:pid   // Ta bort plats

// Sökande
GET    /api/companies/:id/applicants        // Lista sökande
PATCH  /api/companies/:id/applicants/:aid   // Uppdatera status

// Matchningar
GET    /api/companies/:id/matches           // Matchade studenter

// Team
GET    /api/companies/:id/members           // Lista medlemmar
POST   /api/companies/:id/members           // Bjud in medlem
DELETE /api/companies/:id/members/:mid      // Ta bort medlem
```

---

## 🏫 SKOLA - Detaljerad Specifikation

### Datamodell
```typescript
interface School {
  id: string;
  userId: string;
  
  // Skolinfo
  name: string;
  schoolCode: string;                   // Skolkod
  type: 'grundskola' | 'gymnasium' | 'yrkeshogskola' | 'universitet';
  
  // Kontakt
  email: string;
  phone?: string;
  website?: string;
  
  // Adress
  street: string;
  city: string;
  postalCode: string;
  
  // Personal
  admins: SchoolAdmin[];
  
  // Inställningar
  defaultInternshipType?: string;
  autoMatchEnabled: boolean;
  
  // Status
  status: 'active' | 'inactive';
  verifiedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface SchoolClass {
  id: string;
  schoolId: string;
  
  name: string;                         // "TE20A"
  program?: string;                     // "Teknikprogrammet"
  year: number;                         // Årskurs
  graduationYear: number;               // Avgångsår
  
  // Praktikperiod
  internshipType: 'prao' | 'apl' | 'lia';
  internshipStart?: Date;
  internshipEnd?: Date;
  
  // Ansvarig
  supervisorId?: string;
  supervisorName?: string;
  supervisorEmail?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface SchoolAdmin {
  userId: string;
  role: 'owner' | 'admin' | 'supervisor';
  email: string;
  name: string;
}
```

### School Dashboard - Komponenter

```
/dashboard/school/
├── page.tsx                    # Översikt
│   ├── StatsCards              # Studenter, placerade, väntar
│   ├── ClassesSummary          # Status per klass
│   ├── UpcomingDeadlines       # Praktikperiodsdeadlines
│   └── AlertsPanel             # Varningar för oplacerade
│
├── students/
│   ├── page.tsx                # Alla studenter
│   │   ├── StudentFilters      # Klass, status, sök
│   │   ├── StudentTable        # Tabell med alla studenter
│   │   ├── BulkActions         # Påminn, matcha manuellt
│   │   └── ImportButton        # Importera CSV
│   │
│   ├── import/
│   │   └── page.tsx            # Importera studenter
│   │       ├── CSVUploader     # Ladda upp fil
│   │       ├── ColumnMapper    # Mappa kolumner
│   │       ├── PreviewTable    # Förhandsgranska
│   │       └── ImportProgress  # Progress under import
│   │
│   └── [studentId]/
│       └── page.tsx            # Studentdetaljer
│           ├── StudentProfile
│           ├── MatchHistory
│           ├── PlacementStatus
│           └── AdminActions    # Matcha manuellt, kontakta
│
├── classes/
│   ├── page.tsx                # Alla klasser
│   │   ├── ClassList           # Lista klasser
│   │   └── CreateClassButton
│   │
│   ├── create/
│   │   └── page.tsx            # Skapa klass
│   │
│   └── [classId]/
│       ├── page.tsx            # Klassdetaljer
│       │   ├── ClassHeader     # Namn, program
│       │   ├── StudentList     # Studenter i klassen
│       │   ├── InternshipPeriod
│       │   └── ClassStats      # Placeringsstatistik
│       │
│       └── edit/
│           └── page.tsx
│
├── matching/
│   └── page.tsx                # Manuell matchning
│       ├── StudentSelector     # Välj student
│       ├── CompanySearch       # Sök företag
│       ├── MatchPreview        # Förhandsgranska matchning
│       └── ConfirmMatch        # Bekräfta
│
├── reports/
│   ├── page.tsx                # Rapporter
│   │   ├── ReportTypeSelector  # Välj rapporttyp
│   │   ├── DateRangePicker     # Välj period
│   │   └── GenerateButton
│   │
│   └── [type]/
│       └── page.tsx            # Specifik rapport
│           ├── ReportTable
│           ├── ReportCharts
│           └── ExportButtons   # CSV, PDF, Excel
│
├── companies/
│   └── page.tsx                # Partnerföretag
│       ├── CompanyList         # Företag ni samarbetat med
│       ├── CompanyRatings      # Betyg från studenter
│       └── InviteCompany       # Bjud in nytt företag
│
└── settings/
    └── page.tsx                # Skolinställningar
        ├── GeneralSettings
        ├── InternshipDefaults
        ├── TeamManagement
        └── NotificationPrefs
```

### School API Endpoints

```typescript
// CRUD
GET    /api/schools                         // Lista (admin)
GET    /api/schools/:id                     // Skoldetaljer
POST   /api/schools                         // Registrera
PATCH  /api/schools/:id                     // Uppdatera
DELETE /api/schools/:id                     // Ta bort

// Studenter
GET    /api/schools/:id/students            // Lista studenter
POST   /api/schools/:id/students            // Lägg till student
POST   /api/schools/:id/students/import     // Importera CSV
PATCH  /api/schools/:id/students/:sid       // Uppdatera student
DELETE /api/schools/:id/students/:sid       // Ta bort student

// Klasser
GET    /api/schools/:id/classes             // Lista klasser
POST   /api/schools/:id/classes             // Skapa klass
PATCH  /api/schools/:id/classes/:cid        // Uppdatera
DELETE /api/schools/:id/classes/:cid        // Ta bort

// Matchning
POST   /api/schools/:id/matches             // Manuell matchning
GET    /api/schools/:id/matches             // Lista matchningar
PATCH  /api/schools/:id/matches/:mid        // Uppdatera status

// Rapporter
GET    /api/schools/:id/reports/placements  // Placeringsrapport
GET    /api/schools/:id/reports/companies   // Företagsrapport
GET    /api/schools/:id/reports/export      // Exportera
```

---

## 🔄 MATCHNINGSALGORITM

### Poängberäkning

```typescript
interface MatchScore {
  total: number;          // 0-100
  breakdown: {
    location: number;     // 0-30 poäng
    internshipType: number; // 0-25 poäng
    industry: number;     // 0-20 poäng
    skills: number;       // 0-15 poäng
    availability: number; // 0-10 poäng
  };
  explanation: string[];  // Förklaring av poäng
}

function calculateMatchScore(student: Student, company: Company, placement: Placement): MatchScore {
  let score = 0;
  const breakdown = { location: 0, internshipType: 0, industry: 0, skills: 0, availability: 0 };
  const explanation: string[] = [];

  // Plats (0-30)
  if (student.city === company.city) {
    breakdown.location = 30;
    explanation.push('Samma stad (+30)');
  } else if (isNearby(student.city, company.city, 50)) {
    breakdown.location = 20;
    explanation.push('Inom 50km (+20)');
  } else if (isNearby(student.city, company.city, 100)) {
    breakdown.location = 10;
    explanation.push('Inom 100km (+10)');
  }

  // Praktiktyp (0-25)
  if (student.internshipType === placement.internshipType) {
    breakdown.internshipType = 25;
    explanation.push('Matchande praktiktyp (+25)');
  }

  // Bransch (0-20)
  if (student.preferredIndustries.includes(company.industry)) {
    breakdown.industry = 20;
    explanation.push('Önskad bransch (+20)');
  }

  // Skills (0-15)
  const skillMatch = calculateSkillMatch(student.skills, placement.requiredSkills);
  breakdown.skills = Math.round(skillMatch * 15);
  if (breakdown.skills > 0) {
    explanation.push(`Kompetensmatchning ${Math.round(skillMatch * 100)}% (+${breakdown.skills})`);
  }

  // Tillgänglighet (0-10)
  if (datesOverlap(student, placement)) {
    breakdown.availability = 10;
    explanation.push('Datumen matchar (+10)');
  }

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  
  return { total, breakdown, explanation };
}
```

### Matchningsflöde

```
┌─────────────────┐
│  Ny Student     │
│  registrerar    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Triggered:     │
│  matchStudentTo │
│  AllCompanies() │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  För varje      │
│  aktivt företag │◄────────────────┐
└────────┬────────┘                 │
         │                          │
         ▼                          │
┌─────────────────┐                 │
│  Beräkna        │                 │
│  matchScore()   │                 │
└────────┬────────┘                 │
         │                          │
         ▼                          │
┌─────────────────┐    nej          │
│  Score >= 40?   │─────────────────┘
└────────┬────────┘
         │ ja
         ▼
┌─────────────────┐
│  Spara matchning│
│  i databasen    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Skicka notis   │
│  till båda      │
└─────────────────┘
```

---

## 📬 MEDDELANDESYSTEM

### Datamodell
```typescript
interface Conversation {
  id: string;
  participants: {
    userId: string;
    role: 'student' | 'company' | 'school';
    entityId: string;       // studentId, companyId, schoolId
    name: string;
    avatar?: string;
  }[];
  
  // Context
  relatedTo?: {
    type: 'placement' | 'match' | 'application';
    id: string;
  };
  
  lastMessage?: {
    content: string;
    sentAt: Date;
    senderId: string;
  };
  
  // Status
  status: 'active' | 'archived' | 'blocked';
  
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  
  content: string;
  type: 'text' | 'file' | 'system';
  
  // Filer
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  
  // Status
  readBy: { userId: string; readAt: Date }[];
  
  createdAt: Date;
}
```

### Realtidsuppdateringar (Supabase Realtime)
```typescript
// Prenumerera på nya meddelanden
const subscription = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    },
    (payload) => {
      addMessage(payload.new);
    }
  )
  .subscribe();
```

---

## 🔔 NOTIFIKATIONSSYSTEM

### Notifikationstyper
```typescript
type NotificationType =
  | 'new_match'           // Ny matchning hittad
  | 'match_expired'       // Matchning utgången
  | 'interest_received'   // Någon visat intresse
  | 'interest_accepted'   // Ditt intresse accepterades
  | 'interest_declined'   // Ditt intresse avvisades
  | 'application_received'// Ny ansökan
  | 'application_status'  // Ansökningsstatus ändrad
  | 'message_received'    // Nytt meddelande
  | 'placement_reminder'  // Påminnelse om praktikstart
  | 'profile_incomplete'  // Påminnelse att fylla i profil
  | 'deadline_approaching'// Deadline närmar sig
  | 'system_announcement';// Systemmeddelande

interface Notification {
  id: string;
  userId: string;
  
  type: NotificationType;
  title: string;
  body: string;
  
  // Action
  actionUrl?: string;
  actionLabel?: string;
  
  // Relaterat till
  relatedTo?: {
    type: 'match' | 'message' | 'application' | 'placement';
    id: string;
  };
  
  // Status
  read: boolean;
  readAt?: Date;
  
  // Leverans
  channels: ('in_app' | 'email' | 'push')[];
  emailSentAt?: Date;
  pushSentAt?: Date;
  
  createdAt: Date;
}
```

### E-postmallar
```
templates/
├── welcome.tsx              # Välkommen till PraktikFinder
├── email-verification.tsx   # Verifiera din e-post
├── new-match.tsx           # Ny matchning hittad
├── interest-received.tsx   # Någon är intresserad
├── application-received.tsx # Ny ansökan
├── application-accepted.tsx # Din ansökan accepterades
├── application-declined.tsx # Din ansökan avvisades
├── message-notification.tsx # Nytt meddelande
├── deadline-reminder.tsx   # Påminnelse
└── weekly-digest.tsx       # Veckosammanfattning
```

---

## 🗄️ DATABASSCHEMA (Supabase)

```sql
-- Användare (synkad från Clerk)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'company', 'school', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Studenter
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  internship_type TEXT CHECK (internship_type IN ('prao', 'apl', 'lia', 'internship')),
  city TEXT,
  preferred_industries TEXT[],
  skills TEXT[],
  school_id UUID REFERENCES schools(id),
  class_name TEXT,
  cv_url TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  start_date DATE,
  end_date DATE,
  remote_preference TEXT CHECK (remote_preference IN ('onsite', 'remote', 'hybrid')),
  status TEXT DEFAULT 'searching' CHECK (status IN ('searching', 'matched', 'placed', 'completed', 'inactive')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'school_only', 'hidden')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Företag
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  organization_number TEXT UNIQUE,
  industry TEXT,
  size TEXT CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  street TEXT,
  city TEXT,
  postal_code TEXT,
  lat DECIMAL,
  lng DECIMAL,
  description TEXT,
  culture TEXT,
  benefits TEXT[],
  internship_types TEXT[],
  remote_policy TEXT CHECK (remote_policy IN ('onsite', 'remote', 'hybrid')),
  logo_url TEXT,
  cover_image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'active', 'inactive')),
  claimed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Praktikplatser
CREATE TABLE placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  internship_type TEXT NOT NULL,
  required_skills TEXT[],
  preferred_skills TEXT[],
  start_date DATE,
  end_date DATE,
  duration_weeks INTEGER,
  spots_total INTEGER DEFAULT 1,
  spots_filled INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'filled', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skolor
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  school_code TEXT UNIQUE,
  type TEXT CHECK (type IN ('grundskola', 'gymnasium', 'yrkeshogskola', 'universitet')),
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  street TEXT,
  city TEXT,
  postal_code TEXT,
  auto_match_enabled BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Klasser
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  program TEXT,
  year INTEGER,
  graduation_year INTEGER,
  internship_type TEXT,
  internship_start DATE,
  internship_end DATE,
  supervisor_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matchningar
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  placement_id UUID REFERENCES placements(id),
  score INTEGER NOT NULL,
  score_breakdown JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'interested', 'contacted', 'accepted', 'declined', 'expired')),
  student_interested BOOLEAN DEFAULT FALSE,
  company_interested BOOLEAN DEFAULT FALSE,
  matched_by TEXT CHECK (matched_by IN ('algorithm', 'manual', 'school')),
  matched_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, company_id, placement_id)
);

-- Konversationer
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  related_type TEXT,
  related_id UUID,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Konversationsdeltagare
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role TEXT NOT NULL,
  entity_id UUID NOT NULL,
  unread_count INTEGER DEFAULT 0,
  last_read_at TIMESTAMPTZ,
  UNIQUE(conversation_id, user_id)
);

-- Meddelanden
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'file', 'system')),
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifikationer
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  action_url TEXT,
  action_label TEXT,
  related_type TEXT,
  related_id UUID,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  channels TEXT[],
  email_sent_at TIMESTAMPTZ,
  push_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_students_city ON students(city);
CREATE INDEX idx_students_internship_type ON students(internship_type);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_school_id ON students(school_id);

CREATE INDEX idx_companies_city ON companies(city);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_status ON companies(status);

CREATE INDEX idx_placements_company_id ON placements(company_id);
CREATE INDEX idx_placements_status ON placements(status);
CREATE INDEX idx_placements_internship_type ON placements(internship_type);

CREATE INDEX idx_matches_student_id ON matches(student_id);
CREATE INDEX idx_matches_company_id ON matches(company_id);
CREATE INDEX idx_matches_status ON matches(status);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- RLS Policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Studenter kan se och redigera sin egen profil
CREATE POLICY "Students can view own profile"
  ON students FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Students can update own profile"
  ON students FOR UPDATE
  USING (user_id = auth.uid());

-- Företag kan se alla publika studentprofiler
CREATE POLICY "Companies can view public students"
  ON students FOR SELECT
  USING (visibility = 'public' AND status != 'inactive');

-- Fortsätt med fler policies...
```

---

## 🚀 IMPLEMENTATION ROADMAP

### Sprint 1 (Vecka 1-2): Grund
- [ ] Databasschema i Supabase
- [ ] Clerk-webhook för användarsynk
- [ ] Grundläggande rollhantering
- [ ] Student CRUD API
- [ ] Company CRUD API

### Sprint 2 (Vecka 3-4): Profiler
- [ ] Studentprofilsida
- [ ] Företagsprofilsida
- [ ] Bilduppladdning (Supabase Storage)
- [ ] CV-uppladdning

### Sprint 3 (Vecka 5-6): Matchning
- [ ] Matchningsalgoritm
- [ ] Matchningsjobb (cron/edge function)
- [ ] Matchningslista för studenter
- [ ] Sökande-lista för företag

### Sprint 4 (Vecka 7-8): Kommunikation
- [ ] Meddelandesystem
- [ ] Realtidsmeddelanden
- [ ] E-postnotifikationer
- [ ] In-app notifikationer

### Sprint 5 (Vecka 9-10): Skolor
- [ ] Skolregistrering
- [ ] Klasshantering
- [ ] CSV-import
- [ ] Skolrapporter

### Sprint 6 (Vecka 11-12): Polish
- [ ] Bugfixar
- [ ] Prestandaoptimering
- [ ] UI/UX-förbättringar
- [ ] Dokumentation

---

## NÄSTA STEG

**Prioritet 1 - Denna vecka:**
1. Köra SQL-schema i Supabase
2. Skapa Clerk webhook för användarsynk
3. Bygga Student API endpoints

**Prioritet 2 - Nästa vecka:**
1. Studentprofilsida med formulär
2. Företagsprofilsida med formulär
3. Grundläggande matchningslogik
