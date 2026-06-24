import {
  HelpCircle,
  LucideIcon,
  Bell,
  BookOpen,
  Bug,
  CalendarClock,
  ChartNoAxesCombined,
  CheckCircle,
  Clock3,
  CreditCard,
  Download,
  FileText,
  FolderKanban,
  Headphones,
  Lightbulb,
  MessageCircle,
  MessageSquareText,
  Paperclip,
  Search,
  Shield,
  Sparkles,
  Ticket,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { SupportStatusBanner } from "@/components/home/support-status-banner";
import { SupportScrollSmooth } from "@/components/home/support-scroll-smooth";
import { SupportReveal } from "@/components/home/support-reveal";
import { SupportHomeHero } from "@/components/home/support-home-hero";
import { SupportGuidesSection } from "@/components/home/support-guides-section";
import { SupportHelpSection } from "@/components/home/support-help-section";
import {
  getPublishedKBCategories,
  getPublishedKBArticles,
  getAllPublishedArticlesForNav,
} from "@/actions/knowledge-base";
import { getPublicTicketProducts } from "@/actions/public-tickets";
import { EnsMenuSupportSection } from "@/components/home/ensmenu-support-section";
import {
  findEnsMenuKbCategory,
  isEnsMenuSupportPath,
  matchesEnsMenu,
  resolveEnsMenuSupportData,
} from "@/lib/ensmenu-support";
import { getSession } from "@/lib/auth-utils";
import { getPublicSystemSettings } from "@/lib/settings-utils";
import { getPublicHomeContent } from "@/lib/public-home-content";
import { homeVisual } from "@/lib/home-visual";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import { resolvePublicSupportEmail } from "@/lib/support-email";

const iconMap: Record<string, LucideIcon> = {
  Bell,
  BookOpen,
  Bug,
  CalendarClock,
  ChartNoAxesCombined,
  CheckCircle,
  Clock3,
  CreditCard,
  Download,
  FileText,
  FolderKanban,
  Headphones,
  HelpCircle,
  Lightbulb,
  MessageCircle,
  MessageSquareText,
  Paperclip,
  Search,
  Shield,
  Sparkles,
  Ticket,
  Users,
  Wrench,
  Zap,
};

export const dynamic = "force-dynamic";

const sortEnabled = <T extends { enabled: boolean; order: number }>(
  items: T[],
) => items.filter((item) => item.enabled).sort((a, b) => a.order - b.order);

const OPEN_TICKET = "/support/new";

function resolveTicketLink(link: string) {
  if (
    link === "/dashboard/tickets/new" ||
    link === "/dashboard/tickets" ||
    !link
  ) {
    return OPEN_TICKET;
  }
  return link;
}

export default async function Home() {
  const content = getPublicHomeContent();
  const [kbResult, session, settings] = await Promise.all([
    getPublishedKBCategories(),
    getSession(),
    getPublicSystemSettings(),
  ]);

  const kbCategories = kbResult.success ? kbResult.data ?? [] : [];
  const user = session?.user as SessionUser | undefined;
  const isLoggedIn = Boolean(user);

  const supportPaths = sortEnabled(content.supportPaths || []);
  const faqItems = sortEnabled(content.faq || []);
  const publicSupportEmail = resolvePublicSupportEmail(
    settings.general.supportEmail,
  );

  const ensMenuKbCategory = findEnsMenuKbCategory(kbCategories);
  const [productsResult, ensMenuCategoryArticles, fallbackArticlesResult] =
    await Promise.all([
      getPublicTicketProducts(),
      ensMenuKbCategory
        ? getPublishedKBArticles(ensMenuKbCategory.slug)
        : Promise.resolve({ success: true as const, data: [] }),
      ensMenuKbCategory
        ? Promise.resolve({ success: true as const, data: [] })
        : getAllPublishedArticlesForNav(),
    ]);

  const products = productsResult.success ? productsResult.data ?? [] : [];
  const ensMenuData = resolveEnsMenuSupportData({
    supportPaths,
    kbCategories,
    products,
    categoryArticles: ensMenuCategoryArticles.success
      ? ensMenuCategoryArticles.data ?? []
      : [],
    fallbackArticles: fallbackArticlesResult.success
      ? fallbackArticlesResult.data ?? []
      : [],
  });

  const topics = supportPaths
    .filter((path) => !isEnsMenuSupportPath(path))
    .map((path) => ({
      id: path.id,
      title: path.title,
      description: path.description,
      href: resolveTicketLink(path.link),
      icon: iconMap[path.icon] || HelpCircle,
      colorClass: path.colorClass,
    }));

  const kbPreviewCategories = kbCategories
    .filter(
      (c) =>
        !matchesEnsMenu(c.slug) &&
        !matchesEnsMenu(c.title) &&
        !matchesEnsMenu(c.description),
    )
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      description: c.description,
      articleCount: c.articleCount,
    }));

  const ticketsHref = isLoggedIn
    ? "/dashboard/tickets"
    : "/login?callbackUrl=/dashboard/tickets";

  return (
    <div className={cn("flex min-h-screen flex-col text-foreground", homeVisual.shell)}>
      <SupportScrollSmooth />
      <PublicHeader variant="landing" header={content.header} />

      <SupportStatusBanner
        announcements={settings.announcements}
        maintenance={settings.maintenance}
      />

      <main className="flex-1">
        <SupportHomeHero
          isLoggedIn={isLoggedIn}
          userName={user?.name}
          ticketsHref={ticketsHref}
        />

        <SupportReveal delay={0}>
          <EnsMenuSupportSection
            ticketHref={resolveTicketLink(ensMenuData.ticketHref)}
            docsHref={ensMenuData.docsHref}
            searchHref={ensMenuData.searchHref}
            articles={ensMenuData.articles}
          />
        </SupportReveal>

        <SupportReveal delay={60}>
          <SupportGuidesSection
            categories={kbPreviewCategories}
            topics={topics}
          />
        </SupportReveal>

        <SupportReveal delay={120}>
          <SupportHelpSection
            faqItems={faqItems}
            openTicketHref={OPEN_TICKET}
            supportEmail={publicSupportEmail}
          />
        </SupportReveal>
      </main>

      <PublicFooter content={content.footer} />
    </div>
  );
}
