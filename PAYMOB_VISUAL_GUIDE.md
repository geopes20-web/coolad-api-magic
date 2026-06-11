# Paymob Payment Setup - Visual Steps

## 📍 Step-by-Step Visual Guide

### STEP 1️⃣: SQL Setup (5 دقائق)

```
Supabase Dashboard
    ↓
SQL Editor (القائمة اليسرى)
    ↓
فتح جديد أو كليك "New query"
    ↓
انسخ محتوى: SQL_SETUP_QUICK.sql
    ↓
الصق في النافذة
    ↓
Run (الزر الأزرق)
    ↓
انتظر "Query succeeded"
```

---

### STEP 2️⃣: Environment Variables (3 دقائق)

```
Supabase Dashboard
    ↓
Functions (من القائمة اليسرى)
    ↓
Settings (زر أسفل القائمة)
    ↓
Scroll down لـ "Environment Variables"
    ↓
Add 3 variables:

┌─────────────────────────────────────┐
│ Name: PAYMOB_API_KEY                │
│ Value: [from Paymob account]        │
├─────────────────────────────────────┤
│ Name: PAYMOB_INTEGRATION_ID         │
│ Value: [from Paymob account]        │
├─────────────────────────────────────┤
│ Name: PAYMOB_IFRAME_ID              │
│ Value: [from Paymob account]        │
└─────────────────────────────────────┘

    ↓
Save
```

---

### STEP 3️⃣: Deploy Functions (2 دقائق)

```
Supabase Dashboard
    ↓
Functions (من القائمة اليسرى)
    ↓
كليك على: paymob-initiate
    ↓
ابحث عن زر "Deploy" (أعلى يمين)
    ↓
Deploy
    ↓
انتظر "Deployment successful"

[كرر نفس الخطوات لـ: paymob-webhook]
```

---

### STEP 4️⃣: Configure Webhook in Paymob (3 دقائق)

```
Paymob Dashboard (paymob.com)
    ↓
Settings/Configuration
    ↓
Webhooks أو Integrations
    ↓
Add Webhook:

┌──────────────────────────────────────┐
│ URL:                                 │
│ https://ueeojbdtuqsheokmnfsn.        │
│ supabase.co/functions/v1/            │
│ paymob-webhook                       │
├──────────────────────────────────────┤
│ ✅ Transaction Success               │
│ ✅ Transaction Failed                │
│ ✅ Transaction Pending               │
└──────────────────────────────────────┘

    ↓
Save
```

---

### STEP 5️⃣: Test Payment (5 دقائق)

```
التطبيق (http://localhost:8081)
    ↓
اذهب إلى Deal
    ↓
اضغط "Pay Now"
    ↓
أدخل بيانات بطاقة اختبار:

┌──────────────────────┐
│ 4111111111111111     │ (Card Number)
│ 12/25                │ (Expiry)
│ 123                  │ (CVV)
└──────────────────────┘

    ↓
اضغط "Pay"
    ↓
تأكيد الدفع
```

---

### STEP 6️⃣: Verify Success

**في Supabase SQL Editor:**

```sql
-- ✅ تحقق من payment_events
SELECT * FROM payment_events 
ORDER BY created_at DESC LIMIT 1;

-- ✅ تحقق من deal status
SELECT id, payment_status, external_reference 
FROM deals 
WHERE id = 'YOUR_DEAL_ID';
```

**النتيجة المتوقعة:**
```
payment_status: "paid"      ✅
external_reference: filled  ✅
```

---

## 🔄 Expected Payment Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. User clicks "Pay" in MessageThread                   │
├─────────────────────────────────────────────────────────┤
│ 2. paymob-initiate function receives:                   │
│    - idea_id                                            │
│    - deal_id                                            │
│    - amount_usd                                         │
│    - payment_type: "deal_investment"                    │
├─────────────────────────────────────────────────────────┤
│ 3. Function returns:                                    │
│    {                                                    │
│      "ok": true,                                        │
│      "iframe_url": "https://accept.paymob.com/..."      │
│    }                                                    │
├─────────────────────────────────────────────────────────┤
│ 4. User redirects to Payment page with iframe           │
├─────────────────────────────────────────────────────────┤
│ 5. Paymob iframe shows payment options                  │
├─────────────────────────────────────────────────────────┤
│ 6. User enters card details and completes payment       │
├─────────────────────────────────────────────────────────┤
│ 7. Paymob sends webhook to paymob-webhook function      │
├─────────────────────────────────────────────────────────┤
│ 8. Webhook updates:                                     │
│    - deals.payment_status = "paid"                      │
│    - deals.escrow_status = "held"                       │
│    - payment_events table logged                        │
├─────────────────────────────────────────────────────────┤
│ 9. User redirected to PaymentResult page                │
├─────────────────────────────────────────────────────────┤
│ 10. Founder sees deal as "paid" and documents appear    │
└─────────────────────────────────────────────────────────┘
```

---

## 🆘 Troubleshooting Quick Reference

| المشكلة | الحل |
|--------|------|
| 500 error من paymob-initiate | تحقق من environment variables في Functions Settings |
| 404 error من data_room_access | تم إصلاحه في SQL script - تأكد من تشغيل كل الـ SQL |
| Webhook لا يعمل | تحقق من webhook URL في Paymob، يجب أن تكون صحيحة تماماً |
| Deal status لا يتغيّر | تحقق من logs في paymob-webhook function |
| Card declined | استخدم بطاقة اختبار Paymob الصحيحة |

---

## ✅ Completion Checklist

- [ ] تم تشغيل SQL script بنجاح
- [ ] تم إضافة 3 environment variables
- [ ] تم deploy الـ functions
- [ ] تم تكوين webhook في Paymob
- [ ] اختبار الدفع نجح ✅
- [ ] Deal status أصبح "paid"
- [ ] وثائق ظهرت في data room

---

**بعد إتمام كل هذا، الدفع سيكون يعمل بنجاح! 🚀**
