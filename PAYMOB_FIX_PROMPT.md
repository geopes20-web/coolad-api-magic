# Paymob Payment Flow - Complete Fix

## المشاكل الحالية:
1. ❌ `data_room_access` 404 error - الـ RLS Policy مانع الوصول
2. ❌ `paymob-initiate` 500 error - قد تكون الدالة لم تُعاد نشرها
3. ❌ البيانات لا تصل للموقع بعد الدفع الناجح

---

## ✅ الخطوات المطلوبة:

### الخطوة 1: إضافة RLS Policy لـ data_room_access (SQL Editor)
```sql
-- لا نحتاج RLS على data_room_access من الـ frontend للتحقق
-- أضف هذا Policy:
DROP POLICY IF EXISTS "Users view own data room access" ON public.data_room_access;

CREATE POLICY "Users view own data room access"
  ON public.data_room_access FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- للـ INSERT (when paying)
CREATE POLICY "Users insert own data room access"
  ON public.data_room_access FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### الخطوة 2: تحديث environment variables في Supabase
تأكد من وجود:
- `PAYMOB_API_KEY` ✅
- `PAYMOB_INTEGRATION_ID` ✅
- `PAYMOB_IFRAME_ID` ✅

Functions → Settings → Environment Variables

### الخطوة 3: إعادة نشر paymob-initiate function
Functions → paymob-initiate → Deploy

---

## 📊 Workflow المتوقع بعد الإصلاح:

```
1. المستخدم يضغط "Pay" من MessageThread
   ↓
2. يستدعي paymob-initiate function بـ payment_type
   ↓
3. الدالة:
   - تحصل على Paymob auth token
   - تنشئ order
   - تحصل على payment key
   - ترجع iframe URL
   ↓
4. ينتقل المستخدم إلى Payment page
   ↓
5. Paymob iframe يعرض خيارات الدفع
   ↓
6. بعد نجاح الدفع:
   - Paymob يرسل webhook
   - webhook يحدث deals/data_room_access
   - ينتقل لـ PaymentResult
```

---

## 📡 Expected Response من paymob-initiate:
```json
{
  "ok": true,
  "deal_id": "uuid-of-deal",
  "merchant_order_id": "unique-merchant-id",
  "payment_token": "paymob-payment-token",
  "iframe_url": "https://accept.paymob.com/api/acceptance/iframes/...",
  "order_id": 544485785,
  "amount_usd": 250.00,
  "platform_fee_usd": 25.00,
  "net_to_founder_usd": 225.00
}
```

---

## ✅ بعد اكتمال الدفع بنجاح:
- البيانات تصل إلى `deals` table مع `payment_status: "paid"`
- البيانات تصل إلى `data_room_access` table مع `status: "approved"`
- المستخدم ينتقل تلقائياً إلى PaymentResult page
- الوثائق تظهر في الـ data room

---

## 🔧 إذا استمرت المشاكل:

### تحقق من Webhook:
Functions → paymob-webhook → Logs

### تحقق من Events:
Supabase → SQL → 
```sql
SELECT * FROM payment_events ORDER BY created_at DESC LIMIT 10;
```

### تحقق من Deals Status:
```sql
SELECT id, payment_status, external_reference FROM deals 
WHERE created_at > now() - interval '1 hour' 
ORDER BY created_at DESC;
```

---

## 📝 ملاحظات:
- Webhook تحتاج HMAC verification مع Paymob (أضفناها في الكود)
- Session storage مستخدمة لتخزين deal info
- Redirect URL يرجع إلى `/payment-result` بعد الدفع
