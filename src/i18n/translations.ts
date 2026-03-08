export type Language = "en" | "ar";

interface NavTranslations {
  home: string; marketplace: string; submit: string; chat: string;
  dashboard: string; login: string; profile: string; logout: string;
}
interface HeroTranslations {
  badge: string; title1: string; title2: string; subtitle: string; cta1: string; cta2: string;
}
interface FeaturesTranslations {
  title: string; subtitle: string; aiEval: string; aiEvalDesc: string;
  marketplace: string; marketplaceDesc: string; mentor: string; mentorDesc: string;
  risk: string; riskDesc: string;
}
interface StatsTranslations { ideas: string; investors: string; funded: string; }
interface AuthTranslations {
  login: string; register: string; forgotPassword: string; resetPassword: string;
  email: string; password: string; confirmPassword: string; fullName: string;
  role: string; entrepreneur: string; investor: string; explorer: string;
  entrepreneurDesc: string; investorDesc: string; explorerDesc: string;
  noAccount: string; hasAccount: string; signUp: string; signIn: string;
  resetLink: string; newPassword: string; updatePassword: string;
  checkEmail: string; resetSent: string; passwordUpdated: string;
}
interface FooterTranslations {
  description: string; product: string; company: string; about: string;
  blog: string; careers: string; contact: string; rights: string;
}
interface CommonTranslations {
  loading: string; error: string; success: string; save: string; cancel: string; back: string;
}
interface SubmitTranslations {
  title: string; subtitle: string;
  name: string; namePh: string;
  description: string; descriptionPh: string;
  sector: string; sectorPh: string;
  location: string; locationPh: string;
  capital: string; capitalPh: string;
  revenue: string; revenuePh: string;
  teamSize: string; teamSizePh: string;
  teamExp: string; teamExpPh: string;
  competitors: string; competitorsPh: string;
  advantage: string; advantagePh: string;
  audience: string; audiencePh: string;
  timeline: string; timelinePh: string;
  additional: string; additionalPh: string;
  submitBtn: string; submitting: string;
  loginRequired: string;
  successTitle: string; successDesc: string;
  evaluating: string;
  resubmit: string; resubmitDesc: string;
  editAndResubmit: string;
  version: string;
  scoreHistory: string;
  document: string; documentDesc: string; uploadDoc: string;
}
interface MarketplaceTranslations {
  title: string; subtitle: string;
  search: string; searchPh: string;
  filterSector: string; filterCapital: string; filterLocation: string; filterRating: string;
  allSectors: string; allLocations: string; allRatings: string; allCapital: string;
  noResults: string;
  aiScore: string; riskScore: string; marketScore: string;
  viewDetails: string; by: string;
  sortBy: string; newest: string; highestScore: string; lowestRisk: string;
  accepted: string;
}
interface IdeaDetailTranslations {
  overview: string; aiEvaluation: string; marketAnalysis: string;
  financialPotential: string; riskAnalysis: string; team: string;
  investBtn: string; saveBtn: string; savedBtn: string; contactFounder: string;
  capitalRequired: string; expectedRevenue: string; targetAudience: string;
  competitiveAdvantage: string; competitors: string; timeline: string;
  teamSize: string; teamExperience: string;
  scores: string; overallScore: string; marketPotential: string;
  innovationLevel: string; riskLevel: string;
  notFound: string; backToMarketplace: string;
  founder: string; postedOn: string;
  requestAccess: string; accessRequested: string; accessApproved: string;
  chatWithFounder: string;
  recommendations: string;
  executionScore: string; investmentScore: string;
  decision: string;
}
interface ChatTranslations {
  subtitle: string; clear: string; empty: string; placeholder: string; thinking: string;
  suggestion1: string; suggestion2: string; suggestion3: string; suggestion4: string;
}
interface DashboardTranslations {
  myIdeas: string; savedIdeas: string; messages: string; noIdeas: string;
  noSaved: string; noMessages: string; newIdea: string; browseIdeas: string;
  accessRequests: string; noAccessRequests: string;
  approve: string; reject: string; pending: string;
  recommended: string; conversations: string;
  accepted: string; needsImprovement: string; rejected: string;
  resubmit: string;
}

export interface TranslationShape {
  nav: NavTranslations; hero: HeroTranslations; features: FeaturesTranslations;
  stats: StatsTranslations; auth: AuthTranslations; footer: FooterTranslations;
  common: CommonTranslations; submit: SubmitTranslations; marketplace: MarketplaceTranslations;
  ideaDetail: IdeaDetailTranslations; chat: ChatTranslations; dashboard: DashboardTranslations;
}

export const translations: Record<Language, TranslationShape> = {
  en: {
    nav: {
      home: "Home", marketplace: "Marketplace", submit: "Submit Idea",
      chat: "AI Mentor", dashboard: "Dashboard", login: "Login", profile: "Profile", logout: "Logout",
    },
    hero: {
      badge: "AI-Powered Investment Platform", title1: "Where great ideas",
      title2: "meet smart capital",
      subtitle: "Submit your startup idea, get AI-powered evaluation with actionable scores, and connect with investors ready to fund the next big thing.",
      cta1: "Submit Your Idea", cta2: "Explore Marketplace",
    },
    features: {
      title: "The smarter way to invest & build",
      subtitle: "AI-driven evaluation, marketplace discovery, and founder-investor connection",
      aiEval: "AI Evaluation Engine",
      aiEvalDesc: "Get scored across Innovation, Market, Execution, Investment, and Risk — with a clear ACCEPT / IMPROVE / REJECT decision.",
      marketplace: "Curated Marketplace",
      marketplaceDesc: "Only AI-accepted ideas appear. Investors browse pre-validated startups with proven potential.",
      mentor: "AI Startup Mentor",
      mentorDesc: "Chat with an AI that understands your idea and helps you iterate until you get accepted.",
      risk: "Improvement Roadmap",
      riskDesc: "Get specific recommendations with expected score improvements to upgrade your idea.",
    },
    stats: { ideas: "Ideas Evaluated", investors: "Active Investors", funded: "Ideas Accepted" },
    auth: {
      login: "Sign in", register: "Create account", forgotPassword: "Forgot password?",
      resetPassword: "Reset password", email: "Email", password: "Password",
      confirmPassword: "Confirm password", fullName: "Full name", role: "I am a...",
      entrepreneur: "Entrepreneur", investor: "Investor", explorer: "Explorer",
      entrepreneurDesc: "I have startup ideas to share",
      investorDesc: "I'm looking for investment opportunities",
      explorerDesc: "I want to explore and learn",
      noAccount: "Don't have an account?", hasAccount: "Already have an account?",
      signUp: "Sign up", signIn: "Sign in", resetLink: "Send reset link",
      newPassword: "New password", updatePassword: "Update password",
      checkEmail: "Account created successfully! You are now logged in.",
      resetSent: "Check your email for a password reset link.",
      passwordUpdated: "Password updated successfully.",
    },
    footer: {
      description: "AI-powered startup evaluation and investment marketplace. Where ideas meet capital.",
      product: "Product", company: "Company", about: "About", blog: "Blog",
      careers: "Careers", contact: "Contact", rights: "All rights reserved.",
    },
    common: { loading: "Loading...", error: "Error", success: "Success", save: "Save", cancel: "Cancel", back: "Back" },
    submit: {
      title: "Submit Your Idea", subtitle: "Fill in the details and let IDEVEST AI evaluate your startup idea",
      name: "Idea Name", namePh: "e.g. Smart Food Delivery Platform",
      description: "Description", descriptionPh: "Describe your idea in detail...",
      sector: "Sector / Industry", sectorPh: "e.g. Technology, Real Estate, Food...",
      location: "Location / Region", locationPh: "e.g. Cairo, Egypt",
      capital: "Required Capital", capitalPh: "e.g. $50,000",
      revenue: "Expected Annual Revenue", revenuePh: "e.g. $120,000",
      teamSize: "Team Size", teamSizePh: "e.g. 5 members",
      teamExp: "Team Experience", teamExpPh: "e.g. 10 years in tech",
      competitors: "Main Competitors", competitorsPh: "e.g. Uber Eats, DoorDash...",
      advantage: "Competitive Advantage", advantagePh: "What makes your idea unique?",
      audience: "Target Audience", audiencePh: "e.g. Young professionals 25-40",
      timeline: "Expected Timeline", timelinePh: "e.g. 6 months",
      additional: "Additional Info (optional)", additionalPh: "Any other details...",
      submitBtn: "Evaluate with AI", submitting: "Evaluating...",
      loginRequired: "Please login to submit an idea.",
      successTitle: "Idea Evaluated!", successDesc: "Your idea has been evaluated and saved.",
      evaluating: "IDEVEST AI is analyzing your idea...",
      resubmit: "Resubmit Idea", resubmitDesc: "Apply improvements and get re-evaluated",
      editAndResubmit: "Edit & Resubmit",
      version: "Version",
      scoreHistory: "Score History",
      document: "Project Documentation (optional)", documentDesc: "Upload a document (PDF, DOC, TXT) for AI to analyze alongside your idea", uploadDoc: "Upload Document",
    },
    marketplace: {
      title: "Startup Marketplace", subtitle: "AI-accepted startup ideas ready for investment",
      search: "Search", searchPh: "Search ideas by name, sector...",
      filterSector: "Sector", filterCapital: "Investment Size", filterLocation: "Location", filterRating: "AI Rating",
      allSectors: "All Sectors", allLocations: "All Locations", allRatings: "All Ratings", allCapital: "All Sizes",
      noResults: "No ideas found matching your criteria.",
      aiScore: "AI Score", riskScore: "Risk", marketScore: "Market",
      viewDetails: "View Details", by: "by",
      sortBy: "Sort by", newest: "Newest", highestScore: "Highest Score", lowestRisk: "Lowest Risk",
      accepted: "AI Accepted",
    },
    ideaDetail: {
      overview: "Overview", aiEvaluation: "AI Report", marketAnalysis: "Market Analysis",
      financialPotential: "Financials", riskAnalysis: "Risk Analysis", team: "Team",
      investBtn: "Express Interest", saveBtn: "Save Idea", savedBtn: "Saved",
      contactFounder: "Contact Founder",
      capitalRequired: "Capital Required", expectedRevenue: "Expected Revenue",
      targetAudience: "Target Audience", competitiveAdvantage: "Competitive Advantage",
      competitors: "Competitors", timeline: "Timeline",
      teamSize: "Team Size", teamExperience: "Team Experience",
      scores: "AI Scores", overallScore: "Overall Score", marketPotential: "Market Potential",
      innovationLevel: "Innovation", riskLevel: "Risk Level",
      notFound: "Idea not found", backToMarketplace: "Back to Marketplace",
      founder: "Founder", postedOn: "Posted on",
      requestAccess: "Request Full Access", accessRequested: "Access Requested", accessApproved: "Full Access Granted",
      chatWithFounder: "Chat with Founder",
      recommendations: "AI Recommendations",
      executionScore: "Execution", investmentScore: "Investment",
      decision: "AI Decision",
    },
    chat: {
      subtitle: "Your AI startup mentor", clear: "Clear", empty: "Start a conversation with your AI mentor",
      placeholder: "Ask about startup ideas, investments, strategies...",
      thinking: "Thinking...",
      suggestion1: "How do I validate my startup idea?",
      suggestion2: "What makes a good pitch deck?",
      suggestion3: "How to find the right investors?",
      suggestion4: "Common startup mistakes to avoid",
    },
    dashboard: {
      myIdeas: "My Ideas", savedIdeas: "Saved Ideas", messages: "Messages",
      noIdeas: "You haven't submitted any ideas yet.",
      noSaved: "You haven't saved any ideas yet.",
      noMessages: "No messages yet.",
      newIdea: "Submit New Idea", browseIdeas: "Browse Marketplace",
      accessRequests: "Access Requests", noAccessRequests: "No access requests yet.",
      approve: "Approve", reject: "Reject", pending: "Pending",
      recommended: "Recommended Ideas", conversations: "Conversations",
      accepted: "Accepted", needsImprovement: "Needs Improvement", rejected: "Rejected",
      resubmit: "Resubmit",
    },
  },
  ar: {
    nav: {
      home: "الرئيسية", marketplace: "السوق", submit: "تقديم فكرة",
      chat: "مرشد AI", dashboard: "لوحة التحكم", login: "تسجيل الدخول",
      profile: "الملف الشخصي", logout: "تسجيل الخروج",
    },
    hero: {
      badge: "منصة استثمار مدعومة بالذكاء الاصطناعي", title1: "حيث تلتقي الأفكار العظيمة",
      title2: "برأس المال الذكي",
      subtitle: "قدّم فكرة شركتك الناشئة، احصل على تقييم بالذكاء الاصطناعي مع درجات عملية، وتواصل مع مستثمرين جاهزين.",
      cta1: "قدّم فكرتك", cta2: "استكشف السوق",
    },
    features: {
      title: "الطريقة الأذكى للاستثمار والبناء",
      subtitle: "تقييم بالذكاء الاصطناعي، اكتشاف في السوق، وربط المؤسسين بالمستثمرين",
      aiEval: "محرك التقييم الذكي",
      aiEvalDesc: "احصل على تقييم عبر الابتكار والسوق والتنفيذ والاستثمار والمخاطر — مع قرار واضح: قبول / تحسين / رفض.",
      marketplace: "سوق مختارة",
      marketplaceDesc: "فقط الأفكار المقبولة تظهر. المستثمرون يتصفحون شركات ناشئة تم التحقق منها.",
      mentor: "مرشد AI للشركات الناشئة",
      mentorDesc: "تحدث مع ذكاء اصطناعي يفهم فكرتك ويساعدك في التكرار حتى القبول.",
      risk: "خارطة طريق التحسين",
      riskDesc: "احصل على توصيات محددة مع تحسينات متوقعة في الدرجات لترقية فكرتك.",
    },
    stats: { ideas: "فكرة تم تقييمها", investors: "مستثمر نشط", funded: "فكرة مقبولة" },
    auth: {
      login: "تسجيل الدخول", register: "إنشاء حساب", forgotPassword: "نسيت كلمة المرور؟",
      resetPassword: "إعادة تعيين كلمة المرور", email: "البريد الإلكتروني",
      password: "كلمة المرور", confirmPassword: "تأكيد كلمة المرور",
      fullName: "الاسم الكامل", role: "أنا...",
      entrepreneur: "رائد أعمال", investor: "مستثمر", explorer: "مستكشف",
      entrepreneurDesc: "لدي أفكار شركات ناشئة",
      investorDesc: "أبحث عن فرص استثمارية",
      explorerDesc: "أريد الاستكشاف والتعلم",
      noAccount: "ليس لديك حساب؟", hasAccount: "لديك حساب بالفعل؟",
      signUp: "إنشاء حساب", signIn: "تسجيل الدخول",
      resetLink: "إرسال رابط إعادة التعيين",
      newPassword: "كلمة المرور الجديدة", updatePassword: "تحديث كلمة المرور",
      checkEmail: "تم إنشاء الحساب بنجاح! أنت الآن مسجل الدخول.",
      resetSent: "تحقق من بريدك الإلكتروني لرابط إعادة التعيين.",
      passwordUpdated: "تم تحديث كلمة المرور بنجاح.",
    },
    footer: {
      description: "منصة تقييم الشركات الناشئة والاستثمار بالذكاء الاصطناعي. حيث تلتقي الأفكار برأس المال.",
      product: "المنتج", company: "الشركة", about: "عن المنصة", blog: "المدونة",
      careers: "الوظائف", contact: "تواصل معنا", rights: "جميع الحقوق محفوظة.",
    },
    common: { loading: "جاري التحميل...", error: "خطأ", success: "نجاح", save: "حفظ", cancel: "إلغاء", back: "رجوع" },
    submit: {
      title: "قدّم فكرتك", subtitle: "املأ التفاصيل ودع IDEVEST AI يقيّم فكرة شركتك الناشئة",
      name: "اسم الفكرة", namePh: "مثال: منصة توصيل طعام ذكية",
      description: "الوصف", descriptionPh: "اشرح فكرتك بالتفصيل...",
      sector: "القطاع / المجال", sectorPh: "مثال: تكنولوجيا، عقارات، غذاء...",
      location: "الموقع / المنطقة", locationPh: "مثال: القاهرة، مصر",
      capital: "رأس المال المطلوب", capitalPh: "مثال: 500,000 جنيه",
      revenue: "الإيرادات المتوقعة سنوياً", revenuePh: "مثال: 1,200,000 جنيه",
      teamSize: "عدد أعضاء الفريق", teamSizePh: "مثال: 5 أشخاص",
      teamExp: "خبرة الفريق", teamExpPh: "مثال: 10 سنوات في التكنولوجيا",
      competitors: "المنافسون الرئيسيون", competitorsPh: "مثال: طلبات، مرسول...",
      advantage: "الميزة التنافسية", advantagePh: "ما الذي يميز فكرتك؟",
      audience: "الجمهور المستهدف", audiencePh: "مثال: شباب 18-35 سنة",
      timeline: "مدة التنفيذ المتوقعة", timelinePh: "مثال: 6 أشهر",
      additional: "معلومات إضافية (اختياري)", additionalPh: "أي تفاصيل أخرى...",
      submitBtn: "قيّم بالذكاء الاصطناعي", submitting: "جاري التقييم...",
      loginRequired: "يرجى تسجيل الدخول لتقديم فكرة.",
      successTitle: "تم تقييم الفكرة!", successDesc: "تم تقييم فكرتك وحفظها بنجاح.",
      evaluating: "IDEVEST AI يحلل فكرتك...",
      resubmit: "إعادة تقديم الفكرة", resubmitDesc: "طبق التحسينات وأعد التقييم",
      editAndResubmit: "تعديل وإعادة تقديم",
      version: "الإصدار",
      scoreHistory: "سجل الدرجات",
      document: "مستند المشروع (اختياري)", documentDesc: "ارفع مستند (PDF, DOC, TXT) ليحلله الذكاء الاصطناعي مع تفاصيل فكرتك", uploadDoc: "رفع مستند",
    },
    marketplace: {
      title: "سوق الشركات الناشئة", subtitle: "أفكار مقبولة من الذكاء الاصطناعي جاهزة للاستثمار",
      search: "بحث", searchPh: "ابحث عن أفكار بالاسم أو القطاع...",
      filterSector: "القطاع", filterCapital: "حجم الاستثمار", filterLocation: "الموقع", filterRating: "تقييم AI",
      allSectors: "كل القطاعات", allLocations: "كل المواقع", allRatings: "كل التقييمات", allCapital: "كل الأحجام",
      noResults: "لا توجد أفكار تطابق معايير البحث.",
      aiScore: "تقييم AI", riskScore: "المخاطر", marketScore: "السوق",
      viewDetails: "عرض التفاصيل", by: "بواسطة",
      sortBy: "ترتيب حسب", newest: "الأحدث", highestScore: "أعلى تقييم", lowestRisk: "أقل مخاطر",
      accepted: "مقبول من AI",
    },
    ideaDetail: {
      overview: "نظرة عامة", aiEvaluation: "تقرير AI", marketAnalysis: "تحليل السوق",
      financialPotential: "الإمكانات المالية", riskAnalysis: "تحليل المخاطر", team: "الفريق",
      investBtn: "أبدِ اهتمامك", saveBtn: "حفظ الفكرة", savedBtn: "تم الحفظ",
      contactFounder: "تواصل مع المؤسس",
      capitalRequired: "رأس المال المطلوب", expectedRevenue: "الإيرادات المتوقعة",
      targetAudience: "الجمهور المستهدف", competitiveAdvantage: "الميزة التنافسية",
      competitors: "المنافسون", timeline: "الجدول الزمني",
      teamSize: "حجم الفريق", teamExperience: "خبرة الفريق",
      scores: "تقييمات AI", overallScore: "التقييم العام", marketPotential: "إمكانات السوق",
      innovationLevel: "الابتكار", riskLevel: "مستوى المخاطر",
      notFound: "الفكرة غير موجودة", backToMarketplace: "العودة للسوق",
      founder: "المؤسس", postedOn: "نُشرت في",
      requestAccess: "طلب وصول كامل", accessRequested: "تم طلب الوصول", accessApproved: "تم منح الوصول الكامل",
      chatWithFounder: "محادثة المؤسس",
      recommendations: "توصيات AI",
      executionScore: "التنفيذ", investmentScore: "الاستثمار",
      decision: "قرار AI",
    },
    chat: {
      subtitle: "مرشدك الذكي للشركات الناشئة", clear: "مسح", empty: "ابدأ محادثة مع مرشدك الذكي",
      placeholder: "اسأل عن أفكار الشركات الناشئة، الاستثمارات، الاستراتيجيات...",
      thinking: "جاري التفكير...",
      suggestion1: "كيف أتحقق من صلاحية فكرتي؟",
      suggestion2: "ما الذي يجعل عرض المشروع جيداً؟",
      suggestion3: "كيف أجد المستثمرين المناسبين؟",
      suggestion4: "أخطاء الشركات الناشئة الشائعة",
    },
    dashboard: {
      myIdeas: "أفكاري", savedIdeas: "الأفكار المحفوظة", messages: "الرسائل",
      noIdeas: "لم تقدم أي أفكار بعد.",
      noSaved: "لم تحفظ أي أفكار بعد.",
      noMessages: "لا توجد رسائل بعد.",
      newIdea: "تقديم فكرة جديدة", browseIdeas: "تصفح السوق",
      accessRequests: "طلبات الوصول", noAccessRequests: "لا توجد طلبات وصول بعد.",
      approve: "قبول", reject: "رفض", pending: "قيد الانتظار",
      recommended: "أفكار موصى بها", conversations: "المحادثات",
      accepted: "مقبول", needsImprovement: "يحتاج تحسين", rejected: "مرفوض",
      resubmit: "إعادة تقديم",
    },
  },
};

export type TranslationKeys = TranslationShape;
