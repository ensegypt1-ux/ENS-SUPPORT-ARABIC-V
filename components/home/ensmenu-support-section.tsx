import Link from "next/link";
import { ArrowLeft, BookOpen, FileText, UtensilsCrossed } from "lucide-react";
import { ENSMENU_COPY } from "@/lib/ensmenu-support";
import { homeVisual } from "@/lib/home-visual";
import { supportMotion } from "@/lib/home-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EnsMenuArticleLink {
  title: string;
  categorySlug: string;
  slug: string;
  excerpt?: string;
}

interface EnsMenuSupportSectionProps {
  ticketHref: string;
  docsHref: string;
  searchHref: string;
  articles: EnsMenuArticleLink[];
}

export function EnsMenuSupportSection({
  ticketHref,
  docsHref,
  searchHref,
  articles,
}: EnsMenuSupportSectionProps) {
  return (
    <section
      id="ensmenu-support"
      className={cn(homeVisual.section, homeVisual.pageX)}
    >
      <div className={homeVisual.container}>
        <div className={cn(homeVisual.ensMenuPanel, "ps-3.5 sm:ps-5")}>
          <div className={homeVisual.ensMenuHeader}>
            <div className="min-w-0 flex-1">
              <div className={homeVisual.ensMenuEyebrow}>
                <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden />
                {ENSMENU_COPY.eyebrow}
              </div>
              <h2 className={cn("mt-2.5 sm:mt-3", homeVisual.sectionTitle)}>
                {ENSMENU_COPY.title}
              </h2>
              <p className={homeVisual.sectionDesc}>{ENSMENU_COPY.description}</p>
            </div>
            <div className={homeVisual.ensMenuActions}>
              <Button
                asChild
                size="sm"
                className={cn(
                  homeVisual.ensMenuBtn,
                  homeVisual.ensMenuActionBtn,
                  supportMotion.button,
                )}
              >
                <Link href={ticketHref}>{ENSMENU_COPY.actions.ticket}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className={cn(
                  homeVisual.ensMenuOutline,
                  homeVisual.ensMenuActionBtn,
                  supportMotion.button,
                )}
              >
                <Link href={docsHref}>
                  <BookOpen className="h-3.5 w-3.5" />
                  {ENSMENU_COPY.actions.guides}
                </Link>
              </Button>
            </div>
          </div>

          {articles.length > 0 ? (
            <ul
              className={cn(
                "mt-5 space-y-0.5 pt-4 sm:mt-6 sm:pt-5",
                homeVisual.listDivider,
              )}
            >
              {articles.slice(0, 5).map((article) => (
                <li key={`${article.categorySlug}/${article.slug}`}>
                  <Link
                    href={`/docs/${article.categorySlug}/${article.slug}`}
                    className={cn(supportMotion.listRow, "py-2.5 sm:py-2")}
                  >
                    <FileText
                      className={cn(
                        "h-4 w-4 shrink-0 opacity-75 transition-[opacity,color] duration-200 group-hover:opacity-100",
                        homeVisual.ensMenuIcon,
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 text-[14px] font-medium leading-snug text-foreground transition-colors duration-200 group-hover:text-[var(--ensmenu-accent)] sm:text-[15px]">
                      {article.title}
                    </span>
                    <ArrowLeft className={supportMotion.rowArrow} aria-hidden />
                  </Link>
                </li>
              ))}
              <li className="pt-1.5 sm:pt-2">
                <Link
                  href={docsHref}
                  className={cn(
                    "group inline-flex items-center gap-1 px-2 py-1 text-[13px] font-semibold text-[var(--ensmenu-accent)]",
                    supportMotion.textLink,
                  )}
                >
                  {ENSMENU_COPY.actions.allArticles}
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
                </Link>
              </li>
            </ul>
          ) : (
            <p
              className={cn(
                "mt-5 pt-4 sm:mt-6 sm:pt-5",
                homeVisual.listDivider,
                supportMotion.emptyState,
              )}
            >
              {ENSMENU_COPY.actions.noArticles}{" "}
              <Link
                href={searchHref}
                className={cn(
                  "font-semibold text-[var(--ensmenu-accent)]",
                  supportMotion.textLink,
                )}
              >
                {ENSMENU_COPY.actions.search}
              </Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
