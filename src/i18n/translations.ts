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
}
interface ChatTranslations {
  subtitle: string; clear: string; empty: string; placeholder: string; thinking: string;
  suggestion1: string; suggestion2: string; suggestion3: string; suggestion4: string;
}
interface DashboardTranslations {
  myIdeas: string; savedIdeas: string; messages: string; noIdeas: string;
  noSaved: string; noMessages: string; newIdea: string; browseIdeas: string;
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
      home: "Home", marketplace: "Idea Marketplace", submit: "Submit Idea",
      chat: "AI Chat", dashboard: "Dashboard", login: "Login", profile: "Profile", logout: "Logout",
    },
    hero: {
      badge: "AI-Powered Platform", title1: "Turn your idea into",
      title2: "the next big startup",
      subtitle: "Submit your startup idea, get AI-powered evaluation, and connect with investors ready to fund the next big thing.",
      cta1: "Submit Idea", cta2: "Explore Ideas",
    },
    features: {
      title: "Everything you need to launch",
      subtitle: "From idea validation to investor connections — all powered by AI",
      aiEval: "AI Startup Evaluation",
      aiEvalDesc: "Get comprehensive AI analysis of your startup idea across market potential, risks, and financial viability.",
      marketplace: "Investor Marketplace",
      marketplaceDesc: "Connect with verified investors actively looking for promising startup ideas to fund.",
      mentor: "AI Startup Mentor",
      mentorDesc: "Chat with an AI mentor that understands your idea and helps you refine your pitch and strategy.",
      risk: "Smart Risk Analysis",
      riskDesc: "Identify potential risks early and get actionable mitigation strategies powered by AI.",
    },
    stats: { ideas: "Ideas Analyzed", investors: "Active Investors", funded: "Funded Ideas" },
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
      checkEmail: "Check your email for a verification link.",
      resetSent: "Check your email for a password reset link.",
      passwordUpdated: "Password updated successfully.",
    },
    footer: {
      description: "AI-powered startup idea marketplace and evaluation platform.",
      product: "Product", company: "Company", about: "About", blog: "Blog",
      careers: "Careers", contact: "Contact", rights: "All rights reserved.",
    },
    common: { loading: "Loading...", error: "Error", success: "Success", save: "Save", cancel: "Cancel", back: "Back" },
    submit: {
      title: "Submit Your Idea", subtitle: "Fill in the details and let AI evaluate your startup idea",
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
      successTitle: "Idea Submitted!", successDesc: "Your idea has been evaluated and saved.",
      evaluating: "AI is analyzing your idea...",
    },
    marketplace: {
      title: "Idea Marketplace", subtitle: "Discover AI-validated startup ideas ready for investment",
      search: "Search", searchPh: "Search ideas by name, sector...",
      filterSector: "Sector", filterCapital: "Investment Size", filterLocation: "Location", filterRating: "AI Rating",
      allSectors: "All Sectors", allLocations: "All Locations", allRatings: "All Ratings", allCapital: "All Sizes",
      noResults: "No ideas found matching your criteria.",
      aiScore: "AI Score", riskScore: "Risk", marketScore: "Market",
      viewDetails: "View Details", by: "by",
      sortBy: "Sort by", newest: "Newest", highestScore: "Highest Score", lowestRisk: "Lowest Risk",
    },
    ideaDetail: {
      overview: "Overview", aiEvaluation: "AI Evaluation", marketAnalysis: "Market Analysis",
      financialPotential: "Financial Potential", riskAnalysis: "Risk Analysis", team: "Team",
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
      newIdea: "Submit New Idea", browseIdeas: "Browse Ideas",
    },
  },
  ar: {
    nav: {
      home: "الرئيسية", marketplace: "سوق الأفكار", submit: "تقديم فكرة",
      chat: "محادثة AI", dashboard: "لوحة التحكم", login: "تسجيل الدخول",
      profile: "الملف الشخصي", logout: "تسجيل الخروج",
    },
    hero: {
      badge: "منصة مدعومة بالذكاء الاصطناعي", title1: "حوّل فكرتك إلى",
      title2: "الشركة الناشئة القادمة",
      subtitle: "قدّم فكرة شركتك الناشئة، احصل على تقييم بالذكاء الاصطناعي، وتواصل مع مستثمرين جاهزين لتمويل الأفكار الواعدة.",
      cta1: "قدّم فكرة", cta2: "استكشف الأفكار",
    },
    features: {
      title: "كل ما تحتاجه للانطلاق",
      subtitle: "من التحقق من الفكرة إلى التواصل مع المستثمرين — مدعوم بالذكاء الاصطناعي",
      aiEval: "تقييم ذكي للشركات الناشئة",
      aiEvalDesc: "احصل على تحليل شامل بالذكاء الاصطناعي لفكرتك من حيث السوق والمخاطر والجدوى المالية.",
      marketplace: "سوق المستثمرين",
      marketplaceDesc: "تواصل مع مستثمرين موثوقين يبحثون عن أفكار واعدة لتمويلها.",
      mentor: "مرشد AI للشركات الناشئة",
      mentorDesc: "تحدث مع مرشد ذكي يفهم فكرتك ويساعدك في تحسين عرضك واستراتيجيتك.",
      risk: "تحليل ذكي للمخاطر",
      riskDesc: "حدد المخاطر المحتملة مبكراً واحصل على استراتيجيات عملية للتخفيف منها.",
    },
    stats: { ideas: "فكرة تم تحليلها", investors: "مستثمر نشط", funded: "فكرة ممولة" },
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
      checkEmail: "تحقق من بريدك الإلكتروني لرابط التأكيد.",
      resetSent: "تحقق من بريدك الإلكتروني لرابط إعادة التعيين.",
      passwordUpdated: "تم تحديث كلمة المرور بنجاح.",
    },
    footer: {
      description: "منصة سوق الأفكار الناشئة والتقييم بالذكاء الاصطناعي.",
      product: "المنتج", company: "الشركة", about: "عن المنصة", blog: "المدونة",
      careers: "الوظائف", contact: "تواصل معنا", rights: "جميع الحقوق محفوظة.",
    },
    common: { loading: "جاري التحميل...", error: "خطأ", success: "نجاح", save: "حفظ", cancel: "إلغاء", back: "رجوع" },
    submit: {
      title: "قدّم فكرتك", subtitle: "املأ التفاصيل ودع الذكاء الاصطناعي يقيّم فكرة شركتك الناشئة",
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
      successTitle: "تم تقديم الفكرة!", successDesc: "تم تقييم فكرتك وحفظها بنجاح.",
      evaluating: "الذكاء الاصطناعي يحلل فكرتك...",
    },
    marketplace: {
      title: "سوق الأفكار", subtitle: "اكتشف أفكار شركات ناشئة تم التحقق منها بالذكاء الاصطناعي",
      search: "بحث", searchPh: "ابحث عن أفكار بالاسم أو القطاع...",
      filterSector: "القطاع", filterCapital: "حجم الاستثمار", filterLocation: "الموقع", filterRating: "تقييم AI",
      allSectors: "كل القطاعات", allLocations: "كل المواقع", allRatings: "كل التقييمات", allCapital: "كل الأحجام",
      noResults: "لا توجد أفكار تطابق معايير البحث.",
      aiScore: "تقييم AI", riskScore: "المخاطر", marketScore: "السوق",
      viewDetails: "عرض التفاصيل", by: "بواسطة",
      sortBy: "ترتيب حسب", newest: "الأحدث", highestScore: "أعلى تقييم", lowestRisk: "أقل مخاطر",
    },
    ideaDetail: {
      overview: "نظرة عامة", aiEvaluation: "تقييم AI", marketAnalysis: "تحليل السوق",
      financialPotential: "الإمكانات المالية", riskAnalysis: "تحليل المخاطر", team: "الفريق",
      investBtn: "أبدِ اهتمامك", saveBtn: "حفظ الفكرة", savedBtn: "تم الحفظ",
      contactFounder: "تواصل مع المؤسس",
      capitalRequired: "رأس المال المطلوب", expectedRevenue: "الإيرادات المتوقعة",
      targetAudience: "الجمهور المستهدف", competitiveAdvantage: "الميزة التنافسية",
      competitors: "المنافسون", timeline: "الجدول الزمني",
      teamSize: "حجم الفريق", teamExperience: "خبرة الفريق",
      scores: "تقييمات AI", overallScore: "التقييم العام", marketPotential: "إمكانات السوق",
      innovationLevel: "الابتكار", riskLevel: "مستوى المخاطر",
      notFound: "الفكرة غير موجودة", backToMarketplace: "العودة لسوق الأفكار",
      founder: "المؤسس", postedOn: "نُشرت في",
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
      newIdea: "تقديم فكرة جديدة", browseIdeas: "تصفح الأفكار",
    },
  },
};

export type TranslationKeys = TranslationShape;
