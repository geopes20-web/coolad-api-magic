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

export interface TranslationShape {
  nav: NavTranslations; hero: HeroTranslations; features: FeaturesTranslations;
  stats: StatsTranslations; auth: AuthTranslations; footer: FooterTranslations;
  common: CommonTranslations;
}

export const translations: Record<Language, TranslationShape> = {
  en: {
    // Nav
    nav: {
      home: "Home",
      marketplace: "Idea Marketplace",
      submit: "Submit Idea",
      chat: "AI Chat",
      dashboard: "Dashboard",
      login: "Login",
      profile: "Profile",
      logout: "Logout",
    },
    // Hero
    hero: {
      badge: "AI-Powered Platform",
      title1: "Turn your idea into",
      title2: "the next big startup",
      subtitle: "Submit your startup idea, get AI-powered evaluation, and connect with investors ready to fund the next big thing.",
      cta1: "Submit Idea",
      cta2: "Explore Ideas",
    },
    // Features
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
    // Stats
    stats: {
      ideas: "Ideas Analyzed",
      investors: "Active Investors",
      funded: "Funded Ideas",
    },
    // Auth
    auth: {
      login: "Sign in",
      register: "Create account",
      forgotPassword: "Forgot password?",
      resetPassword: "Reset password",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm password",
      fullName: "Full name",
      role: "I am a...",
      entrepreneur: "Entrepreneur",
      investor: "Investor",
      explorer: "Explorer",
      entrepreneurDesc: "I have startup ideas to share",
      investorDesc: "I'm looking for investment opportunities",
      explorerDesc: "I want to explore and learn",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      signUp: "Sign up",
      signIn: "Sign in",
      resetLink: "Send reset link",
      newPassword: "New password",
      updatePassword: "Update password",
      checkEmail: "Check your email for a verification link.",
      resetSent: "Check your email for a password reset link.",
      passwordUpdated: "Password updated successfully.",
    },
    // Footer
    footer: {
      description: "AI-powered startup idea marketplace and evaluation platform.",
      product: "Product",
      company: "Company",
      about: "About",
      blog: "Blog",
      careers: "Careers",
      contact: "Contact",
      rights: "All rights reserved.",
    },
    // Common
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      save: "Save",
      cancel: "Cancel",
      back: "Back",
    },
  },
  ar: {
    nav: {
      home: "الرئيسية",
      marketplace: "سوق الأفكار",
      submit: "تقديم فكرة",
      chat: "محادثة AI",
      dashboard: "لوحة التحكم",
      login: "تسجيل الدخول",
      profile: "الملف الشخصي",
      logout: "تسجيل الخروج",
    },
    hero: {
      badge: "منصة مدعومة بالذكاء الاصطناعي",
      title1: "حوّل فكرتك إلى",
      title2: "الشركة الناشئة القادمة",
      subtitle: "قدّم فكرة شركتك الناشئة، احصل على تقييم بالذكاء الاصطناعي، وتواصل مع مستثمرين جاهزين لتمويل الأفكار الواعدة.",
      cta1: "قدّم فكرة",
      cta2: "استكشف الأفكار",
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
    stats: {
      ideas: "فكرة تم تحليلها",
      investors: "مستثمر نشط",
      funded: "فكرة ممولة",
    },
    auth: {
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      forgotPassword: "نسيت كلمة المرور؟",
      resetPassword: "إعادة تعيين كلمة المرور",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      confirmPassword: "تأكيد كلمة المرور",
      fullName: "الاسم الكامل",
      role: "أنا...",
      entrepreneur: "رائد أعمال",
      investor: "مستثمر",
      explorer: "مستكشف",
      entrepreneurDesc: "لدي أفكار شركات ناشئة",
      investorDesc: "أبحث عن فرص استثمارية",
      explorerDesc: "أريد الاستكشاف والتعلم",
      noAccount: "ليس لديك حساب؟",
      hasAccount: "لديك حساب بالفعل؟",
      signUp: "إنشاء حساب",
      signIn: "تسجيل الدخول",
      resetLink: "إرسال رابط إعادة التعيين",
      newPassword: "كلمة المرور الجديدة",
      updatePassword: "تحديث كلمة المرور",
      checkEmail: "تحقق من بريدك الإلكتروني لرابط التأكيد.",
      resetSent: "تحقق من بريدك الإلكتروني لرابط إعادة التعيين.",
      passwordUpdated: "تم تحديث كلمة المرور بنجاح.",
    },
    footer: {
      description: "منصة سوق الأفكار الناشئة والتقييم بالذكاء الاصطناعي.",
      product: "المنتج",
      company: "الشركة",
      about: "عن المنصة",
      blog: "المدونة",
      careers: "الوظائف",
      contact: "تواصل معنا",
      rights: "جميع الحقوق محفوظة.",
    },
    common: {
      loading: "جاري التحميل...",
      error: "خطأ",
      success: "نجاح",
      save: "حفظ",
      cancel: "إلغاء",
      back: "رجوع",
    },
  },
};

export type TranslationKeys = TranslationShape;
