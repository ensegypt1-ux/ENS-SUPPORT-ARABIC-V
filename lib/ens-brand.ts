/** Official ENS customer support portal branding (Arabic-first). */
export const ENS_BRAND = {
  name: "ENS",
  portalTitle: "دعم ENS",
  portalFullTitle: "بوابة دعم ENS",
  tagline: "الدعم الرسمي لعملاء ENS",
  siteDescription:
    "مركز دعم ENS — افتح تذكرة، تابع طلباتك، وابحث في قاعدة المعرفة من مكان واحد.",
  loginTitle: "تسجيل الدخول",
  loginSubtitle:
    "أدخل بيانات حسابك للوصول إلى تذاكر الدعم ومتابعة طلباتك.",
  loginHeroTitle: "بوابة دعم ENS",
  loginHeroDescription:
    "البوابة الرسمية لعملاء ENS — متابعة التذاكر والمحادثات وطلبات الخدمة من مكان واحد.",
  loginHighlights: [
    {
      title: "متابعة التذاكر",
      description: "اطّلع على حالة طلباتك وردود فريق الدعم",
    },
    {
      title: "محادثات الدعم",
      description: "تواصل مع فريق ENS عند الحاجة",
    },
    {
      title: "قاعدة المعرفة",
      description: "ابحث عن إجابات وإرشادات قبل فتح تذكرة",
    },
  ] as const,
  companyName: "ENS",
  aiAssistantName: "مساعد ENS",
  aiWelcome:
    "مرحبًا! أنا مساعد ENS. اسأل عن الخدمات، قاعدة المعرفة، أو كيفية فتح تذكرة.",
  aiPlaceholder: "اكتب سؤالك…",
  aiFooter: "مساعد ENS — مدعوم بالذكاء الاصطناعي",
  copyright: (year: number) => `© ${year} ENS. جميع الحقوق محفوظة.`,
  /** Local copy of https://ens.eg/favicon.ico */
  faviconUrl: "/favicon.ico",
} as const;

/** Legacy branding values migrated automatically to ENS_BRAND. */
export const LEGACY_SITE_NAMES = [
  "Solvio",
  "Solvio Support",
  "Solvio Customer Support",
  "بوابة Solvio",
  "دعم Solvio",
  "بوابة دعم العملاء",
  "بوابة دعم Solvio",
] as const;

export const LEGACY_SITE_DESCRIPTIONS = [
  "Solvio customer support portal",
  "Official Solvio support portal",
  "Official customer support portal for Solvio products.",
  "البوابة الرسمية لدعم عملاء Solvio.",
  "البوابة الرسمية لدعم عملاء ENS.",
] as const;

export const LEGACY_COMPANY_NAMES = ["Solvio"] as const;
