import type { SupportPath } from "@/types/landing-page";
import type { KBArticle } from "@/types";

/** Match ENSMenu in titles, slugs, and names (case-insensitive). */
export const ENSMENU_PATTERN = /ens\s*menu|ensmenu/i;

export const ENSMENU_COPY = {
  eyebrow: "منتج ENS الأساسي",
  title: "دعم ENSMenu",
  description:
    "مسارك المخصص كعميل ENSMenu — تذاكر وقاعدة معرفة للمنيو والطلبات والتفعيل.",
  actions: {
    ticket: "تذكرة ENSMenu",
    ticketHint: "افتح طلب مرتبط بمنتج ENSMenu",
    guides: "قاعدة معرفة ENSMenu",
    guidesHint: "خطوات الإعداد والتشغيل",
    search: "دور في قاعدة معرفة ENSMenu",
    contact: "تواصل مع الدعم",
    contactHint: "سؤال عام أو تصعيد",
    allArticles: "كل مقالات ENSMenu",
    noArticles:
      "مقالات ENSMenu هتظهر هنا لما تتضاف في قاعدة المعرفة. دلوقتي تقدر تفتح تذكرة أو تدور في قاعدة المعرفة.",
  },
} as const;

export function matchesEnsMenu(text: string | undefined | null): boolean {
  if (!text) return false;
  return ENSMENU_PATTERN.test(text);
}

export function findEnsMenuSupportPath(
  paths: SupportPath[],
): SupportPath | undefined {
  return paths.find(
    (p) =>
      p.enabled &&
      (p.id === "ensmenu" ||
        matchesEnsMenu(p.title) ||
        matchesEnsMenu(p.description)),
  );
}

export function findEnsMenuKbCategory<
  T extends { slug: string; title: string; description?: string },
>(categories: T[]): T | undefined {
  return categories.find(
    (c) =>
      matchesEnsMenu(c.slug) ||
      matchesEnsMenu(c.title) ||
      matchesEnsMenu(c.description),
  );
}

export function findEnsMenuProduct<
  T extends { slug: string; name: string },
>(products: T[]): T | undefined {
  return products.find(
    (p) => matchesEnsMenu(p.slug) || matchesEnsMenu(p.name),
  );
}

export function filterEnsMenuArticles(articles: KBArticle[]): KBArticle[] {
  return articles
    .filter(
      (a) =>
        matchesEnsMenu(a.title) ||
        matchesEnsMenu(a.excerpt) ||
        matchesEnsMenu(a.categorySlug),
    )
    .slice(0, 5);
}

export function buildEnsMenuTicketHref(productSlug?: string): string {
  if (productSlug) {
    return `/support/new?product=${encodeURIComponent(productSlug)}`;
  }
  return "/support/new";
}

export function buildEnsMenuDocsHref(categorySlug?: string): string {
  if (categorySlug) return `/docs/${categorySlug}`;
  return `/docs?q=${encodeURIComponent("ENSMenu")}`;
}

export function isEnsMenuSupportPath(path: SupportPath): boolean {
  return (
    path.id === "ensmenu" ||
    matchesEnsMenu(path.title) ||
    matchesEnsMenu(path.description)
  );
}

export function resolveEnsMenuSupportData(input: {
  supportPaths: SupportPath[];
  kbCategories: Array<{
    slug: string;
    title: string;
    description?: string;
    articleCount: number;
  }>;
  products: Array<{ slug: string; name: string }>;
  categoryArticles: KBArticle[];
  fallbackArticles: KBArticle[];
}) {
  const supportPath = findEnsMenuSupportPath(input.supportPaths);
  const kbCategory = findEnsMenuKbCategory(input.kbCategories);
  const product = findEnsMenuProduct(input.products);

  const ticketHref =
    supportPath?.link && supportPath.link !== "/dashboard/tickets/new"
      ? supportPath.link
      : buildEnsMenuTicketHref(product?.slug);

  const docsHref = buildEnsMenuDocsHref(kbCategory?.slug);
  const searchHref = `/docs?q=${encodeURIComponent("ENSMenu")}`;

  const articlesSource =
    input.categoryArticles.length > 0
      ? input.categoryArticles
      : filterEnsMenuArticles(input.fallbackArticles);

  const articles = articlesSource.map((a) => ({
    title: a.title,
    slug: a.slug,
    categorySlug: a.categorySlug,
    excerpt: a.excerpt,
  }));

  return {
    supportPath,
    kbCategory,
    product,
    ticketHref,
    docsHref,
    searchHref,
    articles,
  };
}
