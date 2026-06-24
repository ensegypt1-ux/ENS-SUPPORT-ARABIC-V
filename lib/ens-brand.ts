/** Official ENS customer support portal branding (Arabic-first, Egyptian tone). */
export const ENS_BRAND = {
  name: "ENS",
  portalTitle: "دعم ENS",
  portalFullTitle: "بوابة دعم ENS",
  tagline: "الدعم الرسمي لعملاء ENS",
  siteDescription:
    "مركز دعم ENS — افتح تذكرة، تابع طلباتك، ودور في قاعدة المعرفة من مكان واحد.",
  companyName: "ENS",
  aiAssistantName: "مساعد ENS",
  aiWelcome:
    "أهلاً! أنا مساعد ENS. اسأل عن الخدمات، قاعدة المعرفة، أو إزاي تفتح تذكرة.",
  aiPlaceholder: "اكتب سؤالك...",
  aiFooter: "مساعد ENS — مدعوم بالذكاء الاصطناعي",
  copyright: (year: number) => `© ${year} ENS. كل الحقوق محفوظة.`,
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
