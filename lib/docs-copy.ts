/** Public knowledge base (/docs) — Arabic copy, ENS Support tone. */
export const DOCS_COPY = {
  eyebrow: "دعم ENS",
  homeTitle: "مرحبًا في قاعدة المعرفة",
  homeSubtitle:
    "ابحث في المقالات والإرشادات للحصول على إجابات سريعة — أو افتح تذكرة إذا احتجت مساعدة مباشرة.",
  searchPlaceholder: "ابحث في المقالات، الأدلة، الحلول…",
  searchHint: "جرّب: «التذاكر»، «ENSMenu»، «التفعيل»",
  searchShortcut: "⌘ K",
  categoriesTitle: "تصفح حسب القسم",
  categoriesAll: "جميع الأقسام",
  articlesTitle: "المقالات",
  articlesFeatured: "مقالات للبدء",
  articlesInCategory: (name: string) => `مقالات ${name}`,
  articleCount: (n: number) =>
    n === 1 ? "مقال واحد" : n === 2 ? "مقالان" : `${n} مقالات`,
  noResults: (q: string) => `لا توجد نتائج لـ «${q}»`,
  noResultsHint: "جرّب كلمات مختلفة أو افتح تذكرة ليساعدك فريق الدعم.",
  empty: {
    title: "قاعدة المعرفة قيد الإعداد",
    description:
      "نعمل على نشر المقالات والأدلة. في هذه الأثناء يمكنك التواصل مع فريق ENS أو فتح تذكرة.",
    openTicket: "افتح تذكرة",
    faq: "أسئلة شائعة",
    contact: "تواصل معنا",
    home: "مركز الدعم",
  },
  emptyCategory: "لا توجد مقالات في هذا القسم بعد.",
  supportStrip: {
    title: "لم تجد ما تبحث عنه؟",
    description: "فريق دعم ENS جاهز لمساعدتك — افتح تذكرة وسنرد في أقرب وقت.",
    cta: "افتح تذكرة",
    faq: "الأسئلة الشائعة",
  },
  breadcrumb: {
    docs: "قاعدة المعرفة",
    overview: "نظرة عامة",
  },
  meta: {
    updated: "آخر تحديث",
    chapter: "الفصل",
  },
  nav: {
    previous: "السابق",
    next: "التالي",
  },
  feedback: {
    title: "هل كان هذا مفيدًا؟",
    thanks: "شكرًا على ملاحظاتك!",
  },
  toc: "في هذه الصفحة",
  backToTop: "العودة إلى الأعلى",
  askAi: "اسأل مساعد ENS",
} as const;
