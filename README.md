# 🏛️ IDEVEST Platform — Technical Documentation

> منصة استثمارية ذكية لربط أصحاب الأفكار بالمستثمرين، مع تقييم تلقائي بالذكاء الاصطناعي وبوابة دفع آمنة.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        IDEVEST Platform                              │
├──────────────┬────────────────────────┬─────────────────────────────┤
│   Frontend   │     Supabase Backend   │    External Services         │
│  React/Vite  │  PostgreSQL + RLS      │                             │
│  TypeScript  │  Edge Functions (Deno) │  Paymob Payment Gateway     │
│  Tailwind    │  Row-Level Security    │  Google Gemini AI           │
│  Framer Motion│  Realtime (WS)       │  WhatsApp OTP               │
└──────────────┴────────────────────────┴─────────────────────────────┘
```

---

## 🔄 Complete User Flows

### 1️⃣ Registration & Login Flow

```
User fills Register Form
    │
    ├─ Supabase signUp()
    │       │
    │       ├─ [Email Confirmation DISABLED] → Session created → /dashboard
    │       │
    │       └─ [Email Confirmation ENABLED]  → Email sent → /login
    │                                                │
    │                                         User clicks link
    │                                         Email confirmed
    │                                         Login with password
    ▼
handle_new_user() TRIGGER
    │
    ├─ INSERT into profiles (full_name, phone_number)
    └─ INSERT into user_roles (entrepreneur/investor/explorer)
```

### 2️⃣ Idea Submission & AI Evaluation Flow

```
Entrepreneur fills SubmitIdea form
    │
    ├─ [Optional] Upload document → Supabase Storage (idea-documents)
    │
    ├─ streamEvaluation() → Google Gemini AI (streaming response)
    │       │
    │       ├─ Parse scores: innovation, market, execution, investment, risk, overall
    │       ├─ Parse DECISION: ACCEPTED | NEEDS_IMPROVEMENT | REJECTED
    │       └─ Parse IMPROVEMENT RECOMMENDATIONS
    │
    ├─ If ACCEPTED → status = "published"
    ├─ If others  → status = "draft"
    │
    └─ INSERT into ideas table
            │
            ├─ Dashboard: Publish/Unpublish button appears
            └─ If published → visible in Marketplace
```

### 3️⃣ Payment & Data Room Flow

```
Investor clicks "Unlock Secure Vault ($5.00)" on IdeaDetail
    │
    ▼
supabase.functions.invoke("paymob-initiate")
    │
    ├─ [409 Guard] Check payment_events for pending payment
    │       ├─ If exists < 30min → Return 409 "Already Processing"
    │       └─ If expired → Delete old event, proceed
    │
    ├─ Auth: Paymob API Key → Get auth token
    ├─ Create deal in DB (status: "pending_founder")
    ├─ Generate merchant_order_id: "DR_<IDEAID8>_<timestamp>" ✅
    ├─ Create Paymob Order (amount in EGP cents)
    ├─ Create Paymob Payment Key (with billing data)
    ├─ Log payment_event (status: "pending")
    ├─ Create data_room_access (status: "pending")
    └─ Return { iframe_url, deal_id, payment_token }
            │
            ▼
    Frontend → Payment Modal appears
            │
    User clicks "Open Paymob Checkout" → New tab
            │
    After payment → Paymob redirects to:
    /payment-result?success=true&merchant_order_id=DR_xxx
            │
            ▼
    PaymentResult page
            │
    ├─ Lookup deal by sessionStorage["paymob_deal_id"]
    ├─ If success=true:
    │       ├─ UPDATE deals SET payment_status="paid"
    │       ├─ UPDATE data_room_access SET status="approved"
    │       └─ Auto-redirect to /contract/:dealId after 2 seconds
    │
    └─ Webhook (paymob-webhook) also fires simultaneously:
            ├─ Verify HMAC-SHA512 signature
            ├─ Lookup payment_event by merchant_order_id
            ├─ UPDATE deals (payment_status, escrow_status, platform_fee 10%)
            ├─ UPDATE data_room_access → "approved"
            └─ Generate HTML contract → stored as Base64 in deals.contract_url
```

### 4️⃣ Contract & Signing Flow

```
Deal payment confirmed
    │
    ├─ Webhook generates HTML contract:
    │       Project, Investment Amount, Equity %, Platform Fee 10%,
    │       Paymob Transaction ID, Signature placeholders
    │
    ├─ Contract stored as data:text/html;base64,... in deals.contract_url
    │
    └─ /contract/:dealId page:
            ├─ Founder signs → founder_signed_at timestamp
            ├─ Investor signs → investor_signed_at timestamp
            └─ Download Contract (Print to PDF)
```

---

## 🗄️ Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (full_name, phone_number, is_blocked) |
| `user_roles` | Roles: entrepreneur / investor / explorer / admin |
| `ideas` | Ideas with AI scores and status |
| `access_requests` | Access requests (free tier) |
| `deals` | Investment transactions |
| `payment_events` | Payment audit log |
| `data_room_access` | Data room unlock per user+idea |
| `nda_agreements` | NDA signatures |
| `saved_ideas` | Bookmarked ideas |
| `messages` | Chat messages |

### Columns Added (2026-06-13)

```sql
data_room_access:  id, user_id, idea_id, status, payment_reference, deal_id, timestamps
deals:             platform_fee_percentage, platform_fee_amount, escrow_status
profiles:          full_name, phone_number
payment_events:    idea_id, user_id
```

---

## 🏗️ Edge Functions

| Function | Purpose |
|----------|---------|
| `paymob-initiate` | Create deal + Paymob order + payment key |
| `payment-webhook` | Verify HMAC, update deal, approve data_room_access, generate contract |
| `ai-chat` | Google Gemini streaming evaluation |
| `send-message` | WhatsApp/email notifications |
| `verify-id-card` | KYC via Mindee API |
| `verify-phone-otp` | Phone OTP verification |

---

## 🔐 Security Model

- All tables have **Row Level Security (RLS)** enabled
- Paymob **HMAC-SHA512** signature verification on every webhook
- `merchant_order_id` is a non-sequential string to prevent enumeration
- **409 deduplication guard** prevents double-charging within 30 minutes
- Platform fee (10%) calculated server-side only, never from client input
- Admins auto-assigned via `handle_new_user()` trigger for whitelisted emails

---

## 🤖 AI Models Used

| Model | Usage |
|-------|-------|
| **Google Gemini 1.5 Flash** | Idea evaluation (streaming scores) |
| **Google Gemini** | AI Chat assistant in `/chat` |

### Evaluation Score Format
```
INNOVATION_SCORE: 75
MARKET_SCORE: 82
EXECUTION_SCORE: 68
INVESTMENT_SCORE: 71
RISK_SCORE: 35
OVERALL_SCORE: 76
DECISION: ACCEPTED

IMPROVEMENT RECOMMENDATIONS
...
```

---

## 🐛 Bugs Fixed (2026-06-13)

| Bug | Fix |
|-----|-----|
| Payment fails — "Already being processed" | 409 guard with 30-min expiry + cleanup of stale events |
| Paymob rejects `merchant_order_id` (UUID) | Changed to `DR_<shortId>_<timestamp>` string format |
| Data Room never unlocks after payment | Webhook upserts `data_room_access.status = "approved"` |
| PaymentResult can't find deal | sessionStorage deal_id lookup + payment_events fallback |
| Register → Login shows "Email not confirmed" | Detects session presence; routes correctly; clear toast message |
| Publish button missing from Dashboard | Globe/Publish button added for accepted+draft ideas |
| IdeaCard founder name too small/truncated weirdly | Fixed font sizing with proper max-width truncation |
| `profiles` missing `full_name`/`phone_number` | Migration adds columns + fixes handle_new_user trigger |
| Payment redirect goes directly to Paymob | Now shows Modal with "Open Paymob Checkout" CTA |
| PaymentResult redirects to wrong page | Now redirects to `/contract/:dealId` with 2s delay on success |

---

## 🧪 Testing the Payment Flow

1. Register as investor (ensure email confirmation disabled in Supabase Auth Settings)
2. Browse Marketplace → Click any published idea
3. Go to "Secure Data Room Space" tab
4. Click "Unlock Secure Vault ($5.00)"
5. Modal appears → Click "Open Paymob Checkout"
6. Complete payment with test card: `4111 1111 1111 1111` / `12/25` / `123` / OTP: `123456`
7. Paymob redirects to `/payment-result?success=true&merchant_order_id=DR_...`
8. Success page → auto-redirects to `/contract/:dealId` after 2 seconds
9. Return to IdeaDetail → Data Room tab shows "Secure Data Room Environment Validated" ✅

---

## 🚀 Deployment

```bash
npm install
npm run dev

# Deploy edge functions
supabase functions deploy paymob-initiate
supabase functions deploy payment-webhook
supabase db push
```

### Required Environment Variables

```env
PAYMOB_API_KEY=...
PAYMOB_INTEGRATION_ID=...
PAYMOB_IFRAME_ID=...
PAYMOB_HMAC_SECRET=...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_GEMINI_API_KEY=...
```

---

*Last updated: 2026-06-13 | Version: 2.0.0 | Platform: IDEVEST*
