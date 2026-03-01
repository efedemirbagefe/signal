# Observer AI – Product Execution Engine

> **Know what to build next. Always.**

Observer ingests every customer signal from Slack, WhatsApp, and Email. It ranks what matters using Claude AI and delivers decision briefs back to your team where they already work — two-way, real-time signal intelligence.

---

## Architecture

```
Signal Sources          Observer AI           Distribution
─────────────          ───────────           ────────────
Slack channels ─────► Ingest API ─────────► Claude Analysis
Gmail inbox    ─────► Normalize  ─────────► Intent Gaps
WhatsApp msgs  ─────► Supabase   ─────────► Slack / WA / Email
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + custom CSS vars |
| AI | Anthropic Claude (claude-sonnet-4-5) |
| Slack | @slack/web-api |
| Email | Nodemailer + Gmail API |
| WhatsApp | Twilio |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo>
cd observer-ai
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values (see sections below).

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run**
4. Copy your `URL`, `anon key`, and `service_role key` to `.env.local`

### 4. Configure Slack

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App**
2. Choose **From scratch** → name it "Observer AI"
3. **OAuth & Permissions** → add Bot Token Scopes:
   - `channels:history`
   - `channels:read`
   - `groups:history`
   - `groups:read`
   - `users:read`
   - `chat:write`
4. Add redirect URL: `http://localhost:3000/api/auth/slack-callback`
5. **Install to Workspace** → copy Bot User OAuth Token
6. Add your Client ID, Client Secret, and Bot Token to `.env.local`

### 5. Configure Gmail OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project → **APIs & Services** → **Enable APIs**
3. Enable **Gmail API**
4. **Credentials** → **Create OAuth 2.0 Client ID**
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:3000/api/auth/gmail-callback`
5. Copy Client ID and Secret to `.env.local`

For outbound email, use Gmail App Password:
1. Enable 2FA on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate an app password → paste as `EMAIL_PASS`

### 6. Configure WhatsApp (Twilio)

1. Sign up at [twilio.com](https://twilio.com)
2. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
3. Or purchase a WhatsApp Business number
4. Set webhook URL in Twilio console:
   ```
   https://your-domain.com/api/webhooks/whatsapp
   ```
   Method: `POST`
5. Copy Account SID, Auth Token, and WhatsApp number to `.env.local`

### 7. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/connect` | Connect sources wizard (4 steps) |
| `/dashboard` | Main dashboard (4 tabs) |
| `/settings/distribution` | Outbound channel config + delivery log |

---

## API Routes

### Ingestion
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/ingest/slack` | Pull Slack messages (last 7 days) |
| POST | `/api/ingest/email` | Pull Gmail inbox |
| POST | `/api/webhooks/whatsapp` | Receive inbound WhatsApp |

### Analysis
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/analyze` | Run Claude analysis on pending signals |
| GET | `/api/analyze` | Fetch existing clusters |
| POST | `/api/intent-snapshot` | Generate full spec for a cluster |

### Distribution
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/distribute/slack` | Post brief to Slack channels |
| POST | `/api/distribute/whatsapp` | Send WhatsApp alert |
| POST | `/api/distribute/email` | Send email digest |

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/auth/slack` | Initiate Slack OAuth |
| GET | `/api/auth/slack-callback` | Handle Slack OAuth callback |
| GET | `/api/auth/gmail` | Initiate Gmail OAuth |
| GET | `/api/auth/gmail-callback` | Handle Gmail OAuth callback |

### Workspace / Data
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/workspace` | Get workspace config |
| PATCH | `/api/workspace` | Update workspace config |
| GET | `/api/signals` | List signals with filters |
| PATCH | `/api/signals` | Mark signal as reviewed |

---

## Database Schema

```sql
workspaces     -- OAuth tokens, channel config, distribution settings
signals        -- Raw ingested messages from all sources
clusters       -- AI-analyzed intent gaps (severity, confidence, evidence)
deliveries     -- Delivery log for all outbound briefs
```

Full schema in `supabase/migrations/001_initial_schema.sql`.

---

## Deploying to Vercel

```bash
npm install -g vercel
vercel

# Add all env vars
vercel env add ANTHROPIC_API_KEY production
vercel env add SUPABASE_URL production
# ... (repeat for all vars in .env.local.example)

# Deploy
vercel --prod
```

**Important:** Update these after deploy:
- `SLACK_REDIRECT_URI` → `https://your-app.vercel.app/api/auth/slack-callback`
- `NEXTAUTH_URL` → `https://your-app.vercel.app`
- Twilio webhook URL → `https://your-app.vercel.app/api/webhooks/whatsapp`

---

## Usage Guide

### First Run
1. Go to `/connect`
2. Click **Connect with Slack** → authorize Observer
3. Add channel IDs or names to monitor (e.g. `general`, `C0123ABCD`)
4. Optionally connect Gmail
5. Configure distribution channels
6. Go to `/dashboard` → click **▶ Run Analysis**

### How Analysis Works
1. Observer pulls recent messages from all connected sources
2. Sends signals to Claude with the product intelligence prompt
3. Claude groups signals into themed **Intent Gaps** with severity scores (0-100)
4. Results appear in all 4 dashboard tabs
5. Click any gap → **Generate Spec** → full product spec with acceptance criteria

### Distribution Triggers
- **Manual**: Click "Share to Slack" / "WhatsApp Alert" / "Email Brief" on any gap card
- **From Intent Snapshot**: Use action buttons inside the modal
- **Batch**: Configure thresholds in Distribution Settings, click Save

---

## Brand Colors

```css
--bg: #0b0c10          /* Page background */
--panel: #0f1118       /* Panels & nav */
--card: #121526        /* Cards */
--accent-green: #46e6a6
--accent-blue: #6ea8ff
--accent-violet: #a78bfa
--warning: #ffd166
--danger: #ff5c7a
--muted: #9aa3b2
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── connect/page.tsx            # 4-step onboarding
│   ├── dashboard/page.tsx          # Main dashboard
│   ├── settings/distribution/      # Distribution settings
│   └── api/
│       ├── analyze/                # Claude analysis pipeline
│       ├── ingest/{slack,email}/   # Source ingestion
│       ├── webhooks/whatsapp/      # Twilio webhook
│       ├── distribute/{slack,whatsapp,email}/
│       ├── auth/{slack,gmail}/     # OAuth flows
│       ├── intent-snapshot/        # Spec generation
│       ├── signals/                # Signal CRUD
│       └── workspace/              # Workspace config
├── components/
│   ├── dashboard/                  # Tab components
│   ├── ui/                         # Badge, Modal, etc.
│   └── IntentSnapshotModal.tsx
└── lib/
    ├── types.ts                    # TypeScript types
    ├── supabase.ts                 # DB helpers
    ├── anthropic.ts                # Claude API
    ├── slack.ts                    # Slack SDK
    ├── email.ts                    # Nodemailer + Gmail
    └── whatsapp.ts                 # Twilio SDK
supabase/
└── migrations/001_initial_schema.sql
```

---

## License

MIT
