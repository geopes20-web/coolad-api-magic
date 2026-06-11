# Paymob Payment Integration - Complete Setup Prompt

## 🎯 الهدف النهائي:
بعد اكتمال الخطوات، عملية الدفع ستكون:
```
User clicks Pay → Paymob iframe → Card payment → Webhook updates → Deal status = "paid"
```

---

## 📋 PART 1: Database Setup (في SQL Editor)

**انسخ والصق هذا كاملاً:**

```sql
-- ==========================================
-- PART 1: Create payment_events table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'paymob',
  event_type text NOT NULL,
  merchant_order_id text NOT NULL,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(merchant_order_id, provider)
);

GRANT SELECT, INSERT ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PART 2: Fix RLS Policies for data_room_access
-- ==========================================
DROP POLICY IF EXISTS "Users view own data room access" ON public.data_room_access;
DROP POLICY IF EXISTS "Users insert own data room access" ON public.data_room_access;
DROP POLICY IF EXISTS "Service role full access data room" ON public.data_room_access;

CREATE POLICY "authenticated_select_own"
  ON public.data_room_access FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "authenticated_insert_own"
  ON public.data_room_access FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_update_own"
  ON public.data_room_access FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "service_role_full_access"
  ON public.data_room_access FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- PART 3: Ensure deals table has required columns
-- ==========================================
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS external_reference TEXT UNIQUE;

ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS platform_fee_percentage NUMERIC(5,2) DEFAULT 10;

ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(10,2) DEFAULT 0;

-- ==========================================
-- PART 4: Fix RLS Policies for deals
-- ==========================================
DROP POLICY IF EXISTS "Founders and investors view own deals" ON public.deals;

CREATE POLICY "deal_owner_access"
  ON public.deals FOR SELECT
  TO authenticated
  USING (
    auth.uid() = founder_id 
    OR auth.uid() = investor_id
  );

CREATE POLICY "deal_owner_update"
  ON public.deals FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = founder_id 
    OR auth.uid() = investor_id
  )
  WITH CHECK (
    auth.uid() = founder_id 
    OR auth.uid() = investor_id
  );

CREATE POLICY "service_role_deal_access"
  ON public.deals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- PART 5: Ensure profiles table has phone_number
-- ==========================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT '+201000000000';

-- ==========================================
-- VERIFICATION: Check if everything is set up
-- ==========================================
-- Run these to verify:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('payment_events', 'deals', 'data_room_access', 'profiles');
-- SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public';
```

**✅ بعد تشغيل هذا الـ SQL، يجب أن ترى:**
```
Query succeeded. No rows returned.
```

---

## 🔐 PART 2: Environment Variables (في Supabase Dashboard)

**اذهب إلى:** Functions → Settings → Environment Variables

**تأكد من وجود هذه 3 متغيرات:**

| المتغير | القيمة | ملاحظات |
|--------|--------|--------|
| `PAYMOB_API_KEY` | `YOUR_ACTUAL_API_KEY` | من Paymob account |
| `PAYMOB_INTEGRATION_ID` | `YOUR_INTEGRATION_ID` | من Paymob account |
| `PAYMOB_IFRAME_ID` | `YOUR_IFRAME_ID` | اختياري - من Paymob |

---

## 🚀 PART 3: Deploy/Redeploy Functions

**تأكد من أن الدوال مُنشرة:**

1. **اذهب إلى:** Functions → paymob-initiate
2. **ابحث عن زر Deploy أعلى يمين الشاشة**
3. **اضغط Deploy**
4. انتظر رسالة "Deployment successful"

**كرر مع:**
- `paymob-webhook`
- `paymob-webhook-hash` (إن وجدت)

---

## 📊 PART 4: Webhook Configuration (في Paymob Dashboard)

**اذهب إلى Paymob Account:**

1. **Settings** → **Webhooks** (أو Integration)
2. **أضف Webhook URL:**
   ```
   https://ueeojbdtuqsheokmnfsn.supabase.co/functions/v1/paymob-webhook
   ```
3. **Select events:** 
   - ✅ Transaction successful
   - ✅ Transaction failed
   - ✅ Transaction pending
4. **Save**

---

## ✅ PART 5: Test Payment Flow

**الآن اختبر الدفع:**

1. **في التطبيق:**
   - اذهب إلى deal
   - ابدأ الدفع
   - أدخل بيانات بطاقة الاختبار:
     ```
     Card: 4111111111111111
     Expiry: 12/25
     CVV: 123
     ```

2. **تحقق من النتائج:**
   
   **في Supabase SQL Editor:**
   ```sql
   -- التحقق من payment_events
   SELECT * FROM payment_events 
   ORDER BY created_at DESC LIMIT 5;
   
   -- التحقق من deals status
   SELECT id, payment_status, external_reference 
   FROM deals 
   WHERE id = 'YOUR_DEAL_ID';
   ```

   **يجب أن ترى:**
   ```
   payment_status: "paid"  ✅
   external_reference: filled ✅
   ```

---

## 🔍 DEBUGGING (إذا لم ينجح)

### إذا رأيت error 500 من paymob-initiate:

```sql
-- 1. تحقق من environment variables:
-- Functions → Settings → scroll to Environment Variables
-- يجب أن تكون الثلاثة موجودة

-- 2. تحقق من logs:
-- Functions → paymob-initiate → Logs
-- ابحث عن ❌ في الـ logs
```

### إذا لم يتغيّر deal status إلى "paid":

```sql
-- 1. تحقق من webhook logs:
-- Functions → paymob-webhook → Logs

-- 2. تحقق من payment_events:
SELECT * FROM payment_events 
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC;

-- 3. تحقق من merchant_order_id format:
SELECT external_reference FROM deals LIMIT 5;
-- يجب أن يكون مرقماً أو مثل: DR_uuid_uuid_timestamp
```

### إذا كان webhook لم يُستدعى:

```sql
-- 1. تحقق من webhook URL في Paymob Dashboard
-- 2. كسر الـ webhook في Paymob:
--    Settings → Webhooks → Test
-- 3. اختبر بـ curl:
--    curl -X POST https://ueeojbdtuqsheokmnfsn.supabase.co/functions/v1/paymob-webhook \
--    -H "Content-Type: application/json" \
--    -d '{"obj":{"merchant_order_id":"TEST123","success":true}}'
```

---

## 📋 Checklist النهائي

- [ ] ✅ تم تشغيل كل الـ SQL
- [ ] ✅ تم إضافة environment variables الثلاثة
- [ ] ✅ تم nشر الـ functions
- [ ] ✅ تم تكوين webhook في Paymob
- [ ] ✅ اختبار الدفع نجح
- [ ] ✅ deal status تغيّر إلى "paid"

---

## 🎉 النتيجة المتوقعة:

بعد إتمام جميع الخطوات:

**Request:**
```json
{
  "idea_id": "xxx",
  "deal_id": "xxx",
  "amount_usd": 250,
  "payment_type": "deal_investment"
}
```

**Response:**
```json
{
  "ok": true,
  "deal_id": "xxx",
  "payment_token": "xxx",
  "iframe_url": "https://accept.paymob.com/api/acceptance/iframes/...",
  "amount_usd": 250,
  "platform_fee_usd": 25,
  "net_to_founder_usd": 225
}
```

**بعد الدفع الناجح:**
```json
{
  "payment_status": "paid",
  "escrow_status": "held",
  "status": "signed"
}
```

---

## 📞 Contact Paymob Support:

إذا كنت تواجه مشاكل مع Paymob API:
- **Email:** support@paymob.com
- **تأكد من:**
  - API Key صحيح
  - Integration ID صحيح
  - IP whitelisting (إن طُلب)
  - Test mode vs Live mode
