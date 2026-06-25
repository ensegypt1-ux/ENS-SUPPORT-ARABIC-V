"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KBArticle, KBCategory } from "@/types";
import { DOCS_COPY } from "@/lib/docs-copy";
import {
  accentClasses,
  accentForSlug,
  iconForSlug,
} from "@/components/knowledge-base/docs-theme";
import { DocsSearchInput, useDocsSearchQuery } from "./docs-search-input";
import { DocsEmptyState } from "./docs-empty-state";
import { DocsSupportStrip } from "./docs-support-strip";
import { homeVisual } from "@/lib/home-visual";

type CategoryWithCount = KBCategory & { articleCount: number };

type DocsHomeViewProps = {
  categories: CategoryWithCount[];
  articles: KBArticle[];
};

function filterDocs(
  categories: CategoryWithCount[],
  articles: KBArticle[],
  q: string
) {
  if (!q) {
    return { categories, articles, hasQuery: false };
  }

  const matchedCategories = categories.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      (c.description ?? "").toLowerCase().includes(q)
  );

  const matchedArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      (a.excerpt ?? "").toLowerCase().includes(q)
  );

  const categorySlugsFromArticles = new Set(
    matchedArticles.map((a) => a.categorySlug)
  );

  const visibleCategories = categories.filter(
    (c) =>
      matchedCategories.some((mc) => mc.slug === c.slug) ||
      categorySlugsFromArticles.has(c.slug)
  );

  return {
    categories: visibleCategories,
    articles: matchedArticles,
    hasQuery: true,
  };
}

function searchParamsDisplay(q: string) {
  return q.length > 48 ? `${q.slice(0, 48)}…` : q;
}

export function DocsHomeView({ categories, articles }: DocsHomeViewProps) {
  const q = useDocsSearchQuery();
  const filtered = useMemo(
    () => filterDocs(categories, articles, q),
    [categories, articles, q]
  );

  const featuredArticles = useMemo(() => {
    if (q) return filtered.articles.slice(0, 12);
    return articles.slice(0, 8);
  }, [articles, filtered.articles, q]);

  const totalArticles = articles.length;
  const hasContent = categories.length > 0 || totalArticles > 0;

  return (
    <div
      className={cn(
        homeVisual.pageX,
        "mx-auto w-full max-w-3xl py-8 lg:max-w-4xl lg:py-10 xl:max-w-5xl"
      )}
      dir="rtl"
    >
      <header className="text-center sm:text-start">
        <p className={homeVisual.eyebrow}>
          <span className={homeVisual.eyebrowDot} aria-hidden />
          {DOCS_COPY.eyebrow}
        </p>
        <h1 className="mt-4 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-[2rem]">
          {DOCS_COPY.homeTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {DOCS_COPY.homeSubtitle}
        </p>
        <div className="mt-6 sm:mt-8">
          <DocsSearchInput variant="hero" />
        </div>
      </header>

      {!hasContent ? (
        <div className="mt-10">
          <DocsEmptyState />
        </div>
      ) : filtered.hasQuery && filtered.articles.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border/60 bg-muted/20 px-6 py-12 text-center">
          <p className="font-medium text-foreground">
            {DOCS_COPY.noResults(searchParamsDisplay(q))}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {DOCS_COPY.noResultsHint}
          </p>
          <DocsSupportStrip className="mt-8 border-none bg-transparent p-0" />
        </div>
      ) : (
        <>
          {filtered.hasQuery ? (
            <section className="mt-10" aria-label="نتائج البحث">
              <h2 className="text-sm font-semibold text-foreground">
                {filtered.articles.length}{" "}
                {filtered.articles.length === 1 ? "نتيجة" : "نتائج"}
              </h2>
              <ul className="mt-4 divide-y divide-border/50 rounded-2xl border border-border/60 bg-card">
                {filtered.articles.map((article) => {
                  const category = categories.find(
                    (c) => c.slug === article.categorySlug
                  );
                  return (
                    <li key={`${article.categorySlug}-${article.slug}`}>
                      <Link
                        href={`/docs/${article.categorySlug}/${article.slug}`}
                        className="group flex items-start gap-3 px-4 py-4 transition-colors hover:bg-muted/30 sm:px-5"
                      >
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-foreground group-hover:text-primary sm:text-[15px]">
                            {article.title}
                          </span>
                          {category ? (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {category.title}
                            </span>
                          ) : null}
                          {article.excerpt ? (
                            <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground sm:text-sm">
                              {article.excerpt}
                            </span>
                          ) : null}
                        </span>
                        <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : (
            <>
              {categories.length > 0 ? (
                <section className="mt-10 lg:mt-12" aria-labelledby="kb-categories">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2
                      id="kb-categories"
                      className="text-sm font-bold text-foreground sm:text-base"
                    >
                      {DOCS_COPY.categoriesTitle}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {categories.length}{" "}
                      {categories.length === 1 ? "قسم" : "أقسام"}
                    </span>
                  </div>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
                    {categories.map((category) => {
                      const accent = accentClasses[accentForSlug(category.slug)];
                      const Icon = iconForSlug(category.slug);
                      return (
                        <li key={category.slug}>
                          <Link
                            href={`/docs/${category.slug}`}
                            className={cn(
                              "group flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3.5 transition-all",
                              "hover:border-primary/25 hover:shadow-sm"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                accent.soft,
                                accent.text
                              )}
                            >
                              {category.icon ? (
                                <span className="text-base leading-none">
                                  {category.icon}
                                </span>
                              ) : (
                                <Icon className="h-4 w-4" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-foreground">
                                {category.title}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {DOCS_COPY.articleCount(category.articleCount)}
                              </span>
                            </span>
                            <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground opacity-60 transition-transform group-hover:-translate-x-0.5 group-hover:text-primary" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}

              {featuredArticles.length > 0 ? (
                <section
                  className="mt-10 lg:mt-12"
                  aria-labelledby="kb-articles"
                >
                  <h2
                    id="kb-articles"
                    className="text-sm font-bold text-foreground sm:text-base"
                  >
                    {DOCS_COPY.articlesFeatured}
                  </h2>
                  <ul className="mt-4 divide-y divide-border/50 rounded-2xl border border-border/60 bg-card">
                    {featuredArticles.map((article) => {
                      const category = categories.find(
                        (c) => c.slug === article.categorySlug
                      );
                      return (
                        <li key={`${article.categorySlug}-${article.slug}`}>
                          <Link
                            href={`/docs/${article.categorySlug}/${article.slug}`}
                            className="group flex items-start gap-3 px-4 py-4 transition-colors hover:bg-muted/30 sm:px-5"
                          >
                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-foreground group-hover:text-primary sm:text-[15px]">
                                {article.title}
                              </span>
                              {category ? (
                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                  {category.title}
                                </span>
                              ) : null}
                              {article.excerpt ? (
                                <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                  {article.excerpt}
                                </span>
                              ) : null}
                            </span>
                            <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : categories.length > 0 ? (
                <p className="mt-10 text-sm text-muted-foreground">
                  {DOCS_COPY.emptyCategory}
                </p>
              ) : null}
            </>
          )}
        </>
      )}

      {hasContent ? <DocsSupportStrip /> : null}
    </div>
  );
}
