# AzaSMS

Bulk SMS marketing platform with analytics dashboard, campaign management, and public API. Functional clone inspired by [luxfysms.app](https://luxfysms.app/), using the same SMS providers.

> The OSINT analysis that originated this project is documented in [`luxfysms-analysis.md`](./luxfysms-analysis.md).

---

## Features

### SMS
- Individual and bulk SMS sending
- Per-send provider selection (Onbuka, EIMS, SMPP)
- Character counter and message preview
- Customizable Sender ID

### Campaigns
- Create campaigns linked to contact groups
- Real-time tracking via Supabase Realtime
- Progress bar, sent/delivered/failed counters
- Start, pause, and resume campaigns

### Contacts
- Full CRUD for contacts
- CSV contact import (with column mapping)
- Contact groups
- Search by name or phone

### Dashboard & Analytics
- 6 metric cards (sent, delivered, failed, delivery rate, active campaigns, contacts)
- Interactive charts with Recharts (sends per day, delivery rate)

### Logs
- Log table with status and provider filters
- CSV export

### Visual Flows
- Drag & drop editor with React Flow
- Custom nodes: Start, SMS, Delay, Condition
- Save/load flows from database

### Settings
- Configuration for all SMS providers (Onbuka, EIMS x3, SMPP)
- API key management (create, revoke, copy)

### Extras
- Native dark mode
- Public landing page
- Authentication via Supabase Auth (email/password)
- Protected routes
- Toast notifications (sonner)

---

## SMS Providers

| Provider | Role | Authentication |
|----------|------|---------------|
| **Onbuka** | Primary | API Key + Secret + App ID (MD5 signature) |
| **EIMS** | Secondary (3 accounts) | Account + Password |
| **SMPP** | Tertiary gateway | Host + Port + System ID + Password |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite 7 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Routing | React Router v7 |
| Charts | Recharts |
| Flows | @xyflow/react (React Flow) |
| Icons | Lucide React |
| CSV | papaparse |
| Backend | Supabase (PostgreSQL + Edge Functions + Auth + Realtime) |
| SMS | Onbuka API v3 + EIMS HTTP + SMPP |

---

## Project Structure

```
azasms/
├── src/
│   ├── main.tsx                        # Entry point + Router + Providers
│   ├── App.tsx                         # Route definitions
│   ├── index.css                       # Tailwind CSS v4 + theme
│   ├── types/
│   │   └── index.ts                    # TypeScript interfaces
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase client
│   │   └── utils.ts                    # cn() helper
│   ├── contexts/
│   │   └── auth-context.tsx            # AuthProvider + useAuth
│   ├── components/
│   │   ├── protected-route.tsx         # Route guard
│   │   ├── layout/
│   │   │   ├── sidebar.tsx             # Side navigation + dark mode
│   │   │   ├── header.tsx              # Header + user dropdown
│   │   │   └── dashboard-layout.tsx    # Layout wrapper with Outlet
│   │   └── ui/                         # 24 shadcn/ui components
│   └── pages/
│       ├── landing.tsx                 # Public page
│       ├── auth/
│       │   ├── login.tsx
│       │   └── register.tsx
│       ├── dashboard/
│       │   └── index.tsx               # Stats + Recharts charts
│       ├── sms/
│       │   ├── send.tsx                # Individual send
│       │   └── bulk.tsx                # Bulk send
│       ├── campaigns/
│       │   ├── index.tsx               # Campaign list
│       │   ├── new.tsx                 # Create campaign
│       │   └── detail.tsx              # Details + realtime
│       ├── contacts/
│       │   ├── index.tsx               # List + CRUD
│       │   └── import.tsx              # CSV import
│       ├── logs/
│       │   └── index.tsx               # Table + filters + export
│       ├── flows/
│       │   ├── index.tsx               # Flow list
│       │   └── editor.tsx              # React Flow editor
│       └── settings/
│           └── index.tsx               # Providers + API keys
├── supabase/
│   ├── functions/
│   │   ├── send-sms/                   # SMS sending (Onbuka + EIMS + SMPP)
│   │   ├── public-api/                 # Public API with key authentication
│   │   ├── campaign-worker/            # Batch campaign processing
│   │   └── webhook-delivery/           # Delivery report webhooks
│   └── migrations/
│       └── 001_initial_schema.sql      # Full schema (10 tables + RLS)
├── luxfysms-analysis.md                # Original OSINT analysis
├── .env.example
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## Database

10 PostgreSQL tables with Row Level Security:

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends auth.users) |
| `provider_settings` | SMS provider configuration (admin) |
| `contacts` | User contacts |
| `contact_groups` | Contact groups |
| `contact_group_members` | N:N contacts-groups relationship |
| `campaigns` | SMS campaigns |
| `campaign_recipients` | Recipients for each campaign |
| `sms_logs` | Log of all sent SMS |
| `api_keys` | Public API keys |
| `flow_templates` | Visual flow templates |

---

## Public API

Authentication via `Authorization: Bearer YOUR_API_KEY` header.

Endpoints are accessed via the Supabase Edge Function `public-api`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/sendsms` | Send SMS |
| GET | `/balance` | Check balance |
| GET | `/status/:id` | Delivery status |
| GET | `/campaign` | List campaigns |
| POST | `/campaign` | Create campaign |
| GET | `/campaign/:id` | Campaign details |
| PUT | `/campaign/:id` | Update campaign |
| DELETE | `/campaign/:id` | Delete campaign |
| GET | `/logs` | Send logs |

### Send Example

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/public-api/sendsms \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "Your message here",
    "provider": "onbuka"
  }'
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- [Supabase](https://supabase.com) account
- SMS provider credentials (Onbuka, EIMS, and/or SMPP)

### Installation

```bash
# Clone the repository
git clone https://github.com/arthuraml/azasms.git
cd azasms

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run in development
npm run dev
```

### Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Apply migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy send-sms
supabase functions deploy public-api
supabase functions deploy campaign-worker
supabase functions deploy webhook-delivery
```

---

## Project Status

- [x] OSINT analysis of luxfysms.app
- [x] SMS provider identification
- [x] Project setup (React + Vite + Tailwind v4 + shadcn/ui)
- [x] Database schema (10 tables + RLS)
- [x] Edge Functions (send-sms, public-api, campaign-worker, webhook-delivery)
- [x] Onbuka API integration
- [x] EIMS integration (3 accounts)
- [x] SMPP placeholder (requires separate TCP microservice)
- [x] Authentication system (Supabase Auth)
- [x] Layout (sidebar + header + dark mode)
- [x] Dashboard with charts (Recharts)
- [x] Individual and bulk SMS sending
- [x] Campaign management (CRUD + worker + realtime)
- [x] Contact management (CRUD + search)
- [x] CSV contact import
- [x] Logs with filters and CSV export
- [x] Visual flow editor (React Flow)
- [x] Provider settings
- [x] Public API with access keys
- [x] Landing page
- [ ] SMPP microservice (TCP doesn't work in Edge Functions)
- [ ] Code splitting (bundle > 500KB)
- [ ] Automated tests

---

## License

Private project for personal and educational use.
