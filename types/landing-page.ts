import { ObjectId } from "mongodb";

export interface LandingNavLink {
  label: string;
  href: string;
}

export interface HeaderSection {
  navigationLinks: LandingNavLink[];
  signInText: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  mobileCtaText: string;
}

export interface HeroMetric {
  id: string;
  value: string;
  label: string;
}

export interface HeroSection {
  eyebrow: string;
  headline: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  metrics: HeroMetric[];
}

export interface SupportPath {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge: string;
  link: string;
  colorClass: string;
  enabled: boolean;
  order: number;
}

export interface WorkflowStep {
  id: string;
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  order: number;
}

export interface Capability {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge: string;
  link: string;
  enabled: boolean;
  order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  initials: string;
  imageUrl?: string;
  text: string;
  rating: number;
  enabled: boolean;
  order: number;
}

export interface Partner {
  id: string;
  name: string;
  displayName: string;
  logoUrl?: string;
  enabled: boolean;
  order: number;
}

export interface ProofStat {
  id: string;
  value: string;
  label: string;
}

export interface ProofSection {
  eyebrow: string;
  headline: string;
  description: string;
  trustStatement: string;
  stats: ProofStat[];
  partners: Partner[];
  testimonials: Testimonial[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  enabled: boolean;
  order: number;
}

export interface ContactCtaSection {
  eyebrow: string;
  headline: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  formTitle: string;
  formDescription: string;
}

export interface FooterSection {
  brandName: string;
  brandHighlight: string;
  tagline: string;
  copyright: string;
  links: {
    product: LandingNavLink[];
    resources: LandingNavLink[];
    company: LandingNavLink[];
    legal: LandingNavLink[];
  };
}

export interface LandingPageContent {
  _id?: ObjectId;
  header: HeaderSection;
  hero: HeroSection;
  supportPaths: SupportPath[];
  workflowSteps: WorkflowStep[];
  capabilities: Capability[];
  proof: ProofSection;
  faq: FAQItem[];
  contactCta: ContactCtaSection;
  footer: FooterSection;
  updatedAt: Date;
  updatedBy: string;
}

export interface LandingPageFormData {
  header?: Partial<HeaderSection>;
  hero?: Partial<HeroSection>;
  supportPaths?: SupportPath[];
  workflowSteps?: WorkflowStep[];
  capabilities?: Capability[];
  proof?: Partial<ProofSection>;
  faq?: FAQItem[];
  contactCta?: Partial<ContactCtaSection>;
  footer?: Partial<FooterSection>;
}

interface LegacyHeroSection {
  headline: string;
  highlightedText: string;
  subheadline: string;
  statsText: string;
  searchPlaceholder: string;
  categoryPlaceholder: string;
  buttonText: string;
}

interface LegacyQuickService {
  id: string;
  icon: string;
  title: string;
  description: string;
  link: string;
  colorClass: string;
  enabled: boolean;
  order: number;
}

interface LegacyServiceCategory {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge: string;
  colorClass: string;
  link: string;
  enabled: boolean;
  order: number;
}

interface LegacyFeaturedService {
  id: string;
  company: string;
  icon: string;
  iconBg: string;
  title: string;
  type: string;
  description: string;
  price: string;
  priceUnit: string;
  location: string;
  link: string;
  enabled: boolean;
  order: number;
}

interface LegacyNewsletterSection {
  headline: string;
  highlightedText: string;
  description: string;
  inputPlaceholder: string;
  buttonText: string;
}

interface LegacyCTASection {
  headline: string;
  highlightedText: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  stats: Array<{
    icon: string;
    text: string;
    color: string;
  }>;
}

interface LegacyPartnersStats {
  headline: string;
  count: string;
}

export type RawLandingPageContent = Partial<LandingPageContent> & {
  hero?: Partial<HeroSection & LegacyHeroSection>;
  supportPaths?: SupportPath[];
  workflowSteps?: WorkflowStep[];
  capabilities?: Capability[];
  proof?: Partial<ProofSection>;
  faq?: FAQItem[];
  contactCta?: Partial<ContactCtaSection>;
  quickServices?: LegacyQuickService[];
  categories?: LegacyServiceCategory[];
  featuredServices?: LegacyFeaturedService[];
  testimonials?: Testimonial[];
  partners?: Partner[];
  partnersStats?: Partial<LegacyPartnersStats>;
  newsletter?: Partial<LegacyNewsletterSection>;
  cta?: Partial<LegacyCTASection>;
};

export const DEFAULT_LANDING_CONTENT: Omit<
  LandingPageContent,
  "_id" | "updatedAt" | "updatedBy"
> = {
  header: {
    navigationLinks: [],
    signInText: "دخول",
    ctaButtonText: "افتح تذكرة",
    ctaButtonLink: "/support/new",
    mobileCtaText: "افتح تذكرة",
  },

  hero: {
    eyebrow: "بوابة دعم ENS",
    headline: "بوابة دعم ENS الرسمية",
    description:
      "افتح تذكرة، تابع طلباتك، ابحث في قاعدة المعرفة، وتواصل مع فريق الدعم — من مكان واحد.",
    primaryButtonText: "افتح تذكرة",
    primaryButtonLink: "/support/new",
    secondaryButtonText: "قاعدة المعرفة",
    secondaryButtonLink: "/docs",
    metrics: [],
  },

  supportPaths: [
    {
      id: "ensmenu",
      icon: "Sparkles",
      title: "ENSMenu",
      description:
        "دعم عملاء ENSMenu — تفعيل المنيو، الطلبات، الإعداد، والتخصيص.",
      badge: "منتج ENS",
      link: "/support/new",
      colorClass: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
      enabled: true,
      order: 0,
    },
    {
      id: "1",
      icon: "Headphones",
      title: "الدعم الفني",
      description: "افتح تذكرة لمشكلات ENS أو أسئلة الحساب أو استكشاف الأخطاء.",
      badge: "الأفضل للمشكلات النشطة",
      link: "/support/new",
      colorClass: "bg-sky-100 text-sky-700",
      enabled: true,
      order: 1,
    },
    {
      id: "2",
      icon: "Download",
      title: "مساعدة التثبيت",
      description: "احصل على دعم إعداد موجّه وفحص البيئة ومساعدة النشر.",
      badge: "دعم انطلاق سريع",
      link: "/support/new",
      colorClass: "bg-emerald-100 text-emerald-700",
      enabled: true,
      order: 2,
    },
    {
      id: "3",
      icon: "Wrench",
      title: "طلب تخصيص",
      description: "ناقش تخصيص الميزات أو تغييرات سير العمل أو دعم التنفيذ المحدود.",
      badge: "للمتطلبات المخصصة",
      link: "/support/new",
      colorClass: "bg-amber-100 text-amber-700",
      enabled: true,
      order: 3,
    },
    {
      id: "4",
      icon: "Bug",
      title: "الإبلاغ عن خلل",
      description: "شارك المشكلات القابلة لإعادة الإنتاج مع لقطات الشاشة والمرفقات لتسريع المعالجة.",
      badge: "تتبع واضح للإصلاحات",
      link: "/support/new",
      colorClass: "bg-rose-100 text-rose-700",
      enabled: true,
      order: 4,
    },
  ],

  workflowSteps: [
    {
      id: "1",
      icon: "FileText",
      title: "قدّم طلبك",
      description: "أنشئ تذكرة دعم مع الفئة والأولوية والتفاصيل التي يحتاجها فريقك.",
      enabled: true,
      order: 1,
    },
    {
      id: "2",
      icon: "Paperclip",
      title: "أرفق السياق",
      description: "ارفع لقطات الشاشة أو المستندات أو تفاصيل الشراء لتسريع التشخيص.",
      enabled: true,
      order: 2,
    },
    {
      id: "3",
      icon: "MessageCircle",
      title: "تعاون في الوقت الفعلي",
      description: "استخدم التعليقات والرسائل والإشعارات للبقاء على اطلاع أثناء التقدم.",
      enabled: true,
      order: 3,
    },
    {
      id: "4",
      icon: "CalendarClock",
      title: "الحل أو جدولة الخطوات التالية",
      description: "تابع تغييرات الحالة وجدول الاجتماعات عند الحاجة وأغلق الدورة بوضوح.",
      enabled: true,
      order: 4,
    },
  ],

  capabilities: [
    {
      id: "1",
      icon: "Ticket",
      title: "إدارة تذاكر منظمة",
      description: "تتبع حالة المشكلة والمسؤول والأولوية والسجل من سجل مشترك واحد.",
      badge: "تقدم واضح لكل طلب",
      link: "/dashboard/tickets",
      enabled: true,
      order: 1,
    },
    {
      id: "2",
      icon: "BookOpen",
      title: "الوصول لقاعدة المعرفة",
      description: "دع العملاء يحلون الأسئلة الشائعة عبر قاعدة المعرفة القابلة للبحث.",
      badge: "خدمة ذاتية قبل التصعيد",
      link: "/docs",
      enabled: true,
      order: 2,
    },
    {
      id: "3",
      icon: "MessageSquareText",
      title: "تواصل في الوقت الفعلي",
      description: "حافظ على المحادثات عبر التعليقات والدردشة والمتابعة المباشرة داخل البوابة.",
      badge: "تقليل التأخير",
      link: "/dashboard/messages",
      enabled: true,
      order: 3,
    },
    {
      id: "4",
      icon: "Paperclip",
      title: "مرفقات الملفات",
      description: "شارك لقطات الشاشة والسجلات والملفات الداعمة مباشرة مع كل طلب.",
      badge: "سياق أفضل للمشكلة",
      link: "/support/new",
      enabled: true,
      order: 4,
    },
    {
      id: "5",
      icon: "Bell",
      title: "الإشعارات والتحديثات",
      description: "ابقَ على اطلاع عند تغيير الحالة أو وصول الردود أو جدولة الاجتماعات.",
      badge: "لا تفوت المتابعة",
      link: "/dashboard/notifications",
      enabled: true,
      order: 5,
    },
    {
      id: "6",
      icon: "Ticket",
      title: "متابعة الطلبات الجارية",
      description: "راجع حالة تذاكرك السابقة والردود والمرفقات من لوحة التحكم.",
      badge: "كل طلباتك في مكان واحد",
      link: "/dashboard/tickets",
      enabled: true,
      order: 6,
    },
  ],

  proof: {
    eyebrow: "كيف نعمل معك",
    headline: "مسار دعم واضح من أول سؤال حتى الحل.",
    description:
      "تجمع بوابة ENS بين الخدمة الذاتية عبر قاعدة المعرفة والمساعد الذكي، والدعم المباشر عبر التذاكر والرسائل، مع متابعة شفافة لكل خطوة.",
    trustStatement:
      "كل طلب يحتفظ بسياقه الكامل — الملفات والمحادثات وتحديثات الحالة — حتى لا تحتاج لإعادة المحاولة من البداية.",
    stats: [],
    partners: [],
    testimonials: [],
  },

  faq: [
    {
      id: "1",
      question: "كيف أفتح تذكرة دعم؟",
      answer:
        "من «افتح تذكرة» — اختر نوع المشكلة، اكتب التفاصيل، وارفع لقطات أو ملفات إذا لزم الأمر. لا يتطلب حسابًا، ويمكنك تسجيل الدخول لمتابعة أسهل.",
      enabled: true,
      order: 1,
    },
    {
      id: "2",
      question: "كيف أتابع حالة طلبي؟",
      answer:
        "سجّل الدخول وانتقل إلى «طلباتي». ستجد الحالة والردود والمرفقات وسجل النشاط — دون الحاجة للمتابعة عبر البريد.",
      enabled: true,
      order: 2,
    },
    {
      id: "3",
      question: "هل أبحث في قاعدة المعرفة أم أفتح تذكرة؟",
      answer:
        "ابدأ بقاعدة المعرفة للإعداد والمشكلات الشائعة. إذا احتجت مساعدة إضافية، افتح تذكرة — سيكمل الفريق من نفس السياق.",
      enabled: true,
      order: 3,
    },
    {
      id: "4",
      question: "هل يمكنني إرفاق ملفات؟",
      answer:
        "نعم. يمكنك رفع لقطات شاشة أو سجلات أو أي ملف يوضح المشكلة — وستبقى جميع البيانات مرتبطة بالتذكرة.",
      enabled: true,
      order: 4,
    },
    {
      id: "5",
      question: "هل أحتاج اجتماعًا أو تخصيصًا؟",
      answer:
        "افتح تذكرة بنوع «تخصيص» أو «تثبيت» — سيحدد الفريق الخطوة التالية معك، ويمكن جدولة مكالمة من البوابة عند الحاجة.",
      enabled: true,
      order: 5,
    },
  ],

  contactCta: {
    eyebrow: "هل تحتاج مساعدة إضافية؟",
    headline: "تواصل معنا — وسنوصلك للمسار المناسب",
    description:
      "للاستفسارات العامة استخدم النموذج. للمشكلات التي تتطلب متابعة، افتح تذكرة لتسجيل الحالة ورد الفريق.",
    primaryButtonText: "افتح تذكرة",
    primaryButtonLink: "/support/new",
    secondaryButtonText: "قاعدة المعرفة",
    secondaryButtonLink: "/docs",
    formTitle: "رسالة إلى الدعم",
    formDescription:
      "اكتب سؤالك بالتفصيل — سنرد عليك أو نوجّهك إلى طلب رسمي عند الحاجة.",
  },

  footer: {
    brandName: "ENS",
    brandHighlight: "الدعم",
    tagline:
      "مركز دعم ENS الرسمي — مساعدة ENSMenu، تذاكر، قاعدة معرفة، ومتابعة واضحة.",
    copyright: "© 2026 ENS. جميع الحقوق محفوظة.",
    links: {
      product: [
        { label: "افتح تذكرة", href: "/support/new" },
        { label: "طلباتي", href: "/login?callbackUrl=/dashboard/tickets" },
      ],
      resources: [
        { label: "قاعدة المعرفة", href: "/#guides" },
        { label: "أسئلة شائعة", href: "/#faq" },
      ],
      company: [
        { label: "دعم ENSMenu", href: "/#ensmenu-support" },
        { label: "قاعدة معرفة ENSMenu", href: "/docs?q=ENSMenu" },
      ],
      legal: [
        { label: "مركز الدعم", href: "/" },
        { label: "تواصل", href: "/#contact" },
        { label: "دخول", href: "/login" },
      ],
    },
  },
};

const heroHeadlineFromLegacy = (
  hero?: Partial<LegacyHeroSection>,
  fallback = DEFAULT_LANDING_CONTENT.hero.headline,
) => {
  if (!hero) return fallback;

  const parts = [hero.headline, hero.highlightedText, hero.subheadline]
    .map((part) => part?.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : fallback;
};

const normalizeHero = (
  hero?: Partial<HeroSection & LegacyHeroSection>,
  header?: Partial<HeaderSection>,
): HeroSection => {
  const current = DEFAULT_LANDING_CONTENT.hero;
  const hasNewShape = Boolean(hero && "primaryButtonText" in hero);

  return {
    eyebrow: hero?.eyebrow ?? current.eyebrow,
    headline: hasNewShape
      ? hero?.headline || current.headline
      : heroHeadlineFromLegacy(hero, current.headline),
    description:
      hero?.description ||
      hero?.statsText ||
      current.description,
    primaryButtonText:
      hero?.primaryButtonText ||
      header?.ctaButtonText ||
      current.primaryButtonText,
    primaryButtonLink:
      hero?.primaryButtonLink ||
      header?.ctaButtonLink ||
      current.primaryButtonLink,
    secondaryButtonText:
      hero?.secondaryButtonText || current.secondaryButtonText,
    secondaryButtonLink:
      hero?.secondaryButtonLink || current.secondaryButtonLink,
    metrics:
      hero?.metrics !== undefined ? hero.metrics : current.metrics,
  };
};

const normalizeSupportPaths = (
  supportPaths?: SupportPath[],
  quickServices?: LegacyQuickService[],
): SupportPath[] => {
  const source = supportPaths?.length
    ? supportPaths
    : quickServices?.map((item) => ({
        ...item,
        badge: "مسار دعم شائع",
      })) || [];

  return source.length > 0 ? source : DEFAULT_LANDING_CONTENT.supportPaths;
};

const normalizeCapabilities = (
  capabilities?: Capability[],
  categories?: LegacyServiceCategory[],
  featuredServices?: LegacyFeaturedService[],
): Capability[] => {
  if (capabilities?.length) return capabilities;
  if (categories?.length) return categories;
  if (featuredServices?.length) {
    return featuredServices.map((service, index) => ({
      id: service.id,
      icon: "Sparkles",
      title: service.title,
      description: service.description,
      badge: service.type || service.company,
      link: service.link || "#",
      enabled: service.enabled,
      order: service.order ?? index + 1,
    }));
  }

  return DEFAULT_LANDING_CONTENT.capabilities;
};

const normalizeProof = (
  proof?: Partial<ProofSection>,
  partners?: Partner[],
  testimonials?: Testimonial[],
  partnersStats?: Partial<LegacyPartnersStats>,
): ProofSection => {
  const current = DEFAULT_LANDING_CONTENT.proof;

  return {
    eyebrow: proof?.eyebrow || current.eyebrow,
    headline: proof?.headline || current.headline,
    description: proof?.description || current.description,
    trustStatement: proof?.trustStatement || current.trustStatement,
    stats:
      proof?.stats !== undefined
        ? proof.stats
        : partnersStats?.count || partnersStats?.headline
          ? [
              {
                id: "legacy-1",
                value: partnersStats?.count || "",
                label: partnersStats?.headline || "",
              },
            ]
          : current.stats,
    partners:
      proof?.partners !== undefined
        ? proof.partners
        : partners?.length
          ? partners
          : current.partners,
    testimonials:
      proof?.testimonials !== undefined
        ? proof.testimonials
        : testimonials?.length
          ? testimonials
          : current.testimonials,
  };
};

const normalizeContactCta = (
  contactCta?: Partial<ContactCtaSection>,
  cta?: Partial<LegacyCTASection>,
  newsletter?: Partial<LegacyNewsletterSection>,
): ContactCtaSection => {
  const current = DEFAULT_LANDING_CONTENT.contactCta;

  return {
    eyebrow: contactCta?.eyebrow || current.eyebrow,
    headline: contactCta?.headline || cta?.headline || current.headline,
    description:
      contactCta?.description ||
      cta?.description ||
      newsletter?.description ||
      current.description,
    primaryButtonText:
      contactCta?.primaryButtonText ||
      cta?.buttonText ||
      current.primaryButtonText,
    primaryButtonLink:
      contactCta?.primaryButtonLink ||
      cta?.buttonLink ||
      current.primaryButtonLink,
    secondaryButtonText:
      contactCta?.secondaryButtonText || current.secondaryButtonText,
    secondaryButtonLink:
      contactCta?.secondaryButtonLink || current.secondaryButtonLink,
    formTitle:
      contactCta?.formTitle ||
      newsletter?.headline ||
      current.formTitle,
    formDescription:
      contactCta?.formDescription ||
      newsletter?.description ||
      current.formDescription,
  };
};

export function normalizeLandingPageContent(
  raw?: RawLandingPageContent | null,
): LandingPageContent {
  const current = DEFAULT_LANDING_CONTENT;
  const header = raw?.header
    ? { ...current.header, ...raw.header }
    : current.header;

  return {
    _id: raw?._id,
    header,
    hero: normalizeHero(raw?.hero, header),
    supportPaths: normalizeSupportPaths(raw?.supportPaths, raw?.quickServices),
    workflowSteps:
      raw?.workflowSteps && raw.workflowSteps.length > 0
        ? raw.workflowSteps
        : current.workflowSteps,
    capabilities: normalizeCapabilities(
      raw?.capabilities,
      raw?.categories,
      raw?.featuredServices,
    ),
    proof: normalizeProof(
      raw?.proof,
      raw?.partners,
      raw?.testimonials,
      raw?.partnersStats,
    ),
    faq:
      raw?.faq && raw.faq.length > 0
        ? raw.faq
        : current.faq,
    contactCta: normalizeContactCta(
      raw?.contactCta,
      raw?.cta,
      raw?.newsletter,
    ),
    footer: raw?.footer
      ? {
          ...current.footer,
          ...raw.footer,
          links: {
            ...current.footer.links,
            ...(raw.footer.links ?? {}),
          },
        }
      : current.footer,
    updatedAt: raw?.updatedAt ?? new Date(),
    updatedBy: raw?.updatedBy ?? "system",
  };
}
