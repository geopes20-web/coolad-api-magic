// Standard NDA template (bilingual support via prop)
export const NDA_TEMPLATE_EN = `NON-DISCLOSURE AGREEMENT (NDA)

This Non-Disclosure Agreement ("Agreement") is entered into between the Disclosing Party (the Founder) and the Receiving Party (the Investor) regarding confidential information related to the startup idea presented on the IDEVEST platform.

1. CONFIDENTIAL INFORMATION
The Receiving Party acknowledges that during evaluation of the startup idea, they may receive information that is confidential and proprietary, including but not limited to: business plans, financial projections, technical specifications, customer data, marketing strategies, and any other non-public information.

2. OBLIGATIONS
The Receiving Party agrees to:
(a) Hold all confidential information in strict confidence
(b) Not disclose such information to any third party without prior written consent
(c) Use the information solely for the purpose of evaluating a potential investment
(d) Not copy, reproduce, or replicate the business idea or its components
(e) Take reasonable precautions to protect the confidentiality

3. EXCLUSIONS
This Agreement does not apply to information that:
(a) Is publicly known at the time of disclosure
(b) Becomes publicly known through no fault of the Receiving Party
(c) Is independently developed without use of confidential information
(d) Is required to be disclosed by law

4. TERM
This Agreement shall remain in effect for a period of two (2) years from the date of signing.

5. REMEDIES
Any breach of this Agreement may result in legal action and damages. The Disclosing Party may seek injunctive relief in addition to monetary damages.

6. GOVERNING LAW
This Agreement shall be governed by the laws of the Arab Republic of Egypt.

By signing below, both parties acknowledge they have read, understood, and agree to be bound by the terms of this Agreement.`;

export const NDA_TEMPLATE_AR = `اتفاقية عدم الإفصاح (NDA)

يتم إبرام اتفاقية عدم الإفصاح هذه ("الاتفاقية") بين الطرف المُفصح (المؤسس) والطرف المُستقبِل (المستثمر) فيما يتعلق بالمعلومات السرية المرتبطة بفكرة الشركة الناشئة المُقدَّمة عبر منصة IDEVEST.

١. المعلومات السرية
يُقرّ الطرف المُستقبِل بأنه قد يطّلع خلال تقييمه لفكرة المشروع على معلومات سرية ومملوكة، تشمل على سبيل المثال لا الحصر: خطط الأعمال، التوقعات المالية، المواصفات الفنية، بيانات العملاء، استراتيجيات التسويق، وأي معلومات أخرى غير عامة.

٢. الالتزامات
يوافق الطرف المُستقبِل على:
(أ) الحفاظ على سرية كافة المعلومات الخاصة بسرية تامة
(ب) عدم الإفصاح عن أي معلومات لأي طرف ثالث دون موافقة كتابية مسبقة
(ج) استخدام المعلومات حصراً لغرض تقييم فرصة الاستثمار المحتملة
(د) عدم نسخ أو إعادة إنتاج أو تقليد فكرة المشروع أو أي من مكوناتها
(هـ) اتخاذ احتياطات معقولة لحماية السرية

٣. الاستثناءات
لا تنطبق هذه الاتفاقية على المعلومات التي:
(أ) كانت معروفة للعامة وقت الإفصاح
(ب) أصبحت معروفة للعامة دون خطأ من الطرف المُستقبِل
(ج) تم تطويرها باستقلالية دون استخدام معلومات سرية
(د) يلزم القانون الإفصاح عنها

٤. المدة
تظل هذه الاتفاقية سارية المفعول لمدة سنتين (٢) من تاريخ التوقيع.

٥. التعويضات
أي خرق لهذه الاتفاقية قد يؤدي إلى إجراءات قانونية وتعويضات. يجوز للطرف المُفصح المطالبة بأمر قضائي بالإضافة إلى التعويضات المالية.

٦. القانون الحاكم
تخضع هذه الاتفاقية لقوانين جمهورية مصر العربية.

بالتوقيع أدناه، يُقرّ الطرفان بأنهما قرآ وفهما وافقا على الالتزام بشروط هذه الاتفاقية.`;

export const STANDARD_CONTRACT_TEMPLATE_EN = (params: {
  founderName: string; investorName: string; ideaTitle: string;
  amount: number; equity: number; valuation: number;
}) => `INVESTMENT AGREEMENT

This Investment Agreement is made between:
- FOUNDER: ${params.founderName}
- INVESTOR: ${params.investorName}

REGARDING: "${params.ideaTitle}"

1. INVESTMENT TERMS
- Investment Amount: $${params.amount.toLocaleString()} USD
- Equity Stake: ${params.equity}%
- Pre-money Valuation: $${params.valuation.toLocaleString()} USD
- Platform Service Fee: 5% of investment amount (deducted at closing)

2. USE OF FUNDS
The Founder commits to using the invested capital exclusively for business development as outlined in the approved business plan.

3. INVESTOR RIGHTS
- Quarterly financial reports
- Right to information regarding major business decisions
- Pro-rata participation in future funding rounds
- Anti-dilution protection (broad-based weighted average)

4. FOUNDER COMMITMENTS
- Vesting schedule: 4 years with 1-year cliff
- Non-compete during the term of investment
- Maintain accurate financial records

5. EXIT PROVISIONS
Standard tag-along and drag-along rights apply. ROFR on share transfers.

6. DISPUTE RESOLUTION
Disputes shall be resolved through arbitration in Cairo, Egypt under CRCICA rules.

7. GOVERNING LAW
Egyptian Law.

This is a binding investment commitment subject to standard due diligence and final long-form documentation.`;

export const STANDARD_CONTRACT_TEMPLATE_AR = (params: {
  founderName: string; investorName: string; ideaTitle: string;
  amount: number; equity: number; valuation: number;
}) => `اتفاقية استثمار

يُبرم هذا العقد بين:
- المؤسس: ${params.founderName}
- المستثمر: ${params.investorName}

بخصوص: "${params.ideaTitle}"

١. شروط الاستثمار
- مبلغ الاستثمار: ${params.amount.toLocaleString()} دولار أمريكي
- نسبة الملكية: ${params.equity}%
- التقييم قبل الاستثمار: ${params.valuation.toLocaleString()} دولار أمريكي
- رسوم خدمة المنصة: ٥٪ من مبلغ الاستثمار (تُخصم عند الإغلاق)

٢. استخدام الأموال
يلتزم المؤسس باستخدام رأس المال المستثمر حصراً لتطوير الأعمال وفق خطة العمل المعتمدة.

٣. حقوق المستثمر
- تقارير مالية ربع سنوية
- الحق في الاطلاع على القرارات التجارية الكبرى
- المشاركة التناسبية في جولات التمويل المستقبلية
- الحماية من التخفيف (متوسط مرجح واسع النطاق)

٤. التزامات المؤسس
- جدول استحقاق: ٤ سنوات مع فترة انتظار سنة
- عدم المنافسة خلال فترة الاستثمار
- الاحتفاظ بسجلات مالية دقيقة

٥. أحكام الخروج
تطبق حقوق التاج-آلونغ والدراج-آلونغ القياسية. حق الشفعة على نقل الأسهم.

٦. تسوية النزاعات
تُحل النزاعات بالتحكيم في القاهرة وفق قواعد مركز القاهرة الإقليمي للتحكيم التجاري الدولي.

٧. القانون الحاكم
القانون المصري.

هذا التزام استثماري ملزم خاضع للفحص النافي للجهالة والتوثيق النهائي.`;
