import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { HOME_COPY } from "@/lib/home-support-copy";
import { homeVisual } from "@/lib/home-visual";
import { supportMotion } from "@/lib/home-motion";
import {
  accentClasses,
  accentForSlug,
  iconForSlug,
} from "@/components/knowledge-base/docs-theme";
import { cn } from "@/lib/utils";
import type { SupportTopic } from "@/types/support-topic";

interface KbCategoryPreview {
  slug: string;
  title: string;
  description?: string;
  articleCount: number;
}

interface SupportGuidesSectionProps {
  categories: KbCategoryPreview[];
  topics?: SupportTopic[];
}

export function SupportGuidesSection({
  categories,
  topics = [],
}: SupportGuidesSectionProps) {
  const top = categories.slice(0, 4);
  const hasTopics = topics.length > 0;

  if (top.length === 0 && !hasTopics) return null;

  return (
    <section id="guides" className={cn(homeVisual.section, homeVisual.pageX)}>
      <div className={homeVisual.container}>
        <div className={cn(homeVisual.surface, homeVisual.surfacePad)}>
          <div className={homeVisual.sectionHeader}>
            <div className="min-w-0">
              <p className={homeVisual.eyebrow}>
                <span className={homeVisual.eyebrowDot} aria-hidden />
                موارد الدعم
              </p>
              <h2 className={cn("mt-2.5 sm:mt-3", homeVisual.sectionTitle)}>
                {HOME_COPY.kb.title}
              </h2>
              <p className={homeVisual.sectionDesc}>{HOME_COPY.kb.description}</p>
            </div>
            <Link
              href="/docs"
              className={cn(
                "group inline-flex shrink-0 items-center gap-1 self-start text-[13px] font-semibold text-primary sm:mt-1",
                supportMotion.textLink,
              )}
            >
              {HOME_COPY.kb.browseAll}
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
            </Link>
          </div>

          {top.length > 0 ? (
            <ul className={cn(homeVisual.guidesList, homeVisual.listDivider, "pt-4 sm:pt-5")}>
              {top.map((category) => {
                const accent = accentClasses[accentForSlug(category.slug)];
                const Icon = iconForSlug(category.slug);
                return (
                  <li key={category.slug}>
                    <Link
                      href={`/docs/${category.slug}`}
                      className={cn(
                        supportMotion.listRow,
                        "gap-2.5 rounded-xl py-2.5 sm:gap-3 sm:py-3",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br shadow-sm transition-transform duration-200 ease-out group-hover:scale-[1.04] motion-reduce:group-hover:scale-100 sm:h-9 sm:w-9 sm:rounded-xl",
                          accent.gradient,
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 text-foreground/85 sm:h-4 sm:w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-medium leading-snug text-foreground transition-colors duration-200 group-hover:text-primary sm:text-[15px]">
                          {category.title}
                        </span>
                        {category.articleCount > 0 ? (
                          <span className="text-[11px] text-muted-foreground sm:text-[12px]">
                            {category.articleCount} مقال
                          </span>
                        ) : null}
                      </span>
                      <ArrowLeft className={supportMotion.rowArrow} aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div
              className={cn(
                "mt-5 flex items-start gap-2.5 sm:mt-6",
                homeVisual.listDivider,
                "pt-4 sm:pt-5",
                supportMotion.emptyState,
              )}
            >
              <BookOpen
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70"
                aria-hidden
              />
              <p className="text-[14px]">{HOME_COPY.kb.empty}</p>
            </div>
          )}

          {hasTopics ? (
            <div className={cn("mt-5 pt-4 sm:mt-6 sm:pt-5", homeVisual.listDivider)}>
              <p className="text-[12px] font-semibold text-muted-foreground">
                {HOME_COPY.kb.topicsLabel}
              </p>
              <ul className={homeVisual.topicsRow}>
                {topics.slice(0, 6).map((topic) => {
                  const Icon = topic.icon;
                  return (
                    <li key={topic.id}>
                      <Link href={topic.href} className={supportMotion.pill}>
                        <Icon className="h-3 w-3" aria-hidden />
                        {topic.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
