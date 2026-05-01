# IDEVEST — منصة تقييم وربط مشاريع ريادة الأعمال بالذكاء الاصطناعي

منصة كاملة لتقييم أفكار المشاريع، التحقق من الهوية (KYC)، وربط المؤسسين بالمستثمرين مع نظام Escrow آمن.

---

## 🔑 حساب الأدمن

```
Email:    admin@idevest.com
Password: Admin@123456
```

افتح `/login`، سجّل دخول بهذه البيانات، سيتم تحويلك تلقائيًا إلى `/admin`.

---

## 🚀 تشغيل المشروع محليًا (Localhost)

### المتطلبات
- **Node.js 18+** أو **Bun** (مفضّل): https://bun.sh
- **Git**

### خطوات التشغيل

```bash
# 1) Clone المشروع
git clone <YOUR_GIT_URL>
cd <PROJECT_FOLDER>

# 2) تثبيت الحزم
npm install
# أو
bun install

# 3) تشغيل سيرفر التطوير
npm run dev
# أو
bun run dev
```

سيتم فتح المشروع على: **http://localhost:8080**

> ✅ **ملاحظة**: ملف `.env` موجود تلقائيًا ومُهيأ على Backend السحابي — لا حاجة لإنشاء حساب Supabase أو إضافة مفاتيح.

---

## 📦 المكتبات الرئيسية

| المكتبة | الاستخدام |
|---|---|
| `react` + `vite` + `typescript` | إطار العمل |
| `@supabase/supabase-js` | الاتصال بالـ Backend |
| `firebase` | OTP عبر Phone (أرقام Test مجانية) |
| `framer-motion` | الأنيميشن |
| `tailwindcss` + `shadcn/ui` | التصميم |
| `react-router-dom` | التنقل |
| `lucide-react` | الأيقونات |
| `@tanstack/react-query` | إدارة البيانات |

كل هذه المكتبات تُثبَّت تلقائيًا مع `npm install`.

---

## 🏗 البنية التقنية

| الجزء | التقنية |
|---|---|
| **Frontend** | React 18 + Vite + TypeScript |
| **Backend** | Supabase (Lovable Cloud) — PostgreSQL + Edge Functions |
| **Auth** | Email/Password + Google OAuth |
| **Phone OTP** | Firebase Test Numbers (مجاني) |
| **KYC** | Mindee API + Lovable AI (Gemini) للتحقق من البطاقات |
| **AI Evaluation** | GPT-5 لتقييم الأفكار (0-100) |
| **AI Chat** | Gemini-3-Flash بـ streaming |
| **Payments** | Paymob (Test Mode) — Hold & Capture (Escrow) |
| **Storage** | Supabase Storage (`kyc-documents` + `idea-documents`) |

---

## 🗂 صفحات المشروع

| الصفحة | الوصف |
|---|---|
| `/` | Landing |
| `/login` | تسجيل الدخول (يحوّل الأدمن لـ `/admin` تلقائيًا) |
| `/register` | التسجيل |
| `/dashboard` | الصفحة الرئيسية للمستخدم |
| `/marketplace` | استكشاف الأفكار |
| `/submit-idea` | رفع فكرة جديدة + تقييم AI |
| `/idea/:id` | تفاصيل الفكرة |
| `/kyc` | التحقق من الهوية |
| `/verify-phone` | تأكيد رقم الهاتف بـ OTP |
| `/chat/:id` | محادثة المؤسس بعد NDA |
| `/my-deals` | الصفقات الخاصة بك |
| `/admin` | لوحة الأدمن (KYC / Users / Ideas) |

---

## 🔐 ميزات الأمان

- ✅ Row-Level Security على كل الجداول
- ✅ Roles منفصلة في جدول `user_roles` (لا تخزين في profiles)
- ✅ NDA إلزامي قبل المحادثة
- ✅ فلترة الـ Chat من PII (أرقام/إيميلات/روابط)
- ✅ KYC إلزامي قبل أي تعامل مالي
- ✅ Escrow: الدفع يتم Hold ولا يُحوَّل للمؤسس إلا بعد الموافقة
- ✅ Webhook بـ HMAC verification

---

## 🛠 الأوامر المفيدة

```bash
npm run dev        # تشغيل السيرفر المحلي
npm run build      # بناء النسخة النهائية
npm run preview    # معاينة build
npm run test       # تشغيل الاختبارات (Vitest)
```

---

## 🌐 الوصول للـ Backend

من داخل Lovable: افتح **Cloud → View Backend** للوصول إلى:
- جداول قاعدة البيانات
- المستخدمين
- Edge Functions Logs
- Storage Buckets
- Secrets

---

## 📝 ملاحظات للتطوير

### Phone OTP (Firebase Test Numbers)
Firebase Console → Authentication → Sign-in method → Phone → **Phone numbers for testing**.
أضف الرقم والكود (مثلاً: `+201234567890` كود `123456`) — هيشتغل تلقائيًا بدون باقة Blaze.

### Paymob (Test Mode)
- المنصة تأخذ **15% رسوم** تلقائيًا من كل صفقة
- في التيست: استخدم بطاقات Paymob التجريبية
- Webhook URL: `https://ueeojbdtuqsheokmnfsn.supabase.co/functions/v1/payment-webhook`

### تشغيل أوامر إدارية
```bash
# إعادة إنشاء حساب الأدمن
curl -X POST https://ueeojbdtuqsheokmnfsn.supabase.co/functions/v1/admin-bootstrap

# مسح حساب من قاعدة البيانات (بالإيميل)
curl -X POST https://ueeojbdtuqsheokmnfsn.supabase.co/functions/v1/admin-delete-user \
  -H "Content-Type: application/json" \
  -d '{"email":"someone@example.com"}'
```

---

## 🆘 مشاكل شائعة

**الإيميل ما وصلش لـ reset password؟**
- افحص فولدر **Spam/Junk**.
- إيميلات Lovable الافتراضية بتيجي من `noreply@mail.app.supabase.io` وممكن تتعتبر spam.
- لو عايز إيميلات من دومين خاص، فعّل Custom Email Domain من Cloud → Emails.

**الـ Google Sign-in مش شغال؟**
- متأكد إن الـ redirect URL مضاف في Google Cloud Console.

---

صُنع بـ ❤️ على Lovable
