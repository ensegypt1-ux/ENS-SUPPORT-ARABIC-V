"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown, Compass } from "lucide-react";
import type { KBCategory, KBArticle } from "@/types";
import { accentClasses, accentForSlug, iconForSlug } from "./docs-theme";
import { DOCS_COPY } from "@/lib/docs-copy";

interface DocsSidebarProps {
  categories: Array<KBCategory & { articleCount: number }>;
  articles: KBArticle[];
  query?: string;
  onNavigate?: () => void;
}

export function DocsSidebar({
  categories,
  articles,
  query = "",
  onNavigate,
}: DocsSidebarProps) {
  const pathname = usePathname();
  const q = query.trim().toLowerCase();

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (slug: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const groups = useMemo(() => {
    return categories
      .map((category) => {
        const categoryArticles = articles.filter(
          (a) => a.categorySlug === category.slug
        );
        if (!q) return { category, articles: categoryArticles, matched: false };

        const categoryMatches = category.title.toLowerCase().includes(q);
        const matching = categoryMatches
          ? categoryArticles
          : categoryArticles.filter(
              (a) =>
                a.title.toLowerCase().includes(q) ||
                (a.excerpt ?? "").toLowerCase().includes(q)
            );
        return { category, articles: matching, matched: categoryMatches };
      })
      .filter((g) => q === "" || g.matched || g.articles.length > 0);
  }, [categories, articles, q]);

  const isOverview = pathname === "/docs";

  return (
    <nav className="px-3 py-5" aria-label="تصفح قاعدة المعرفة">
      <Link
        href="/docs"
        onClick={onNavigate}
        className={cn(
          "mb-4 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
          isOverview
            ? "bg-primary/10 font-semibold text-primary"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        <Compass className="h-4 w-4 shrink-0" />
        {DOCS_COPY.breadcrumb.overview}
      </Link>

      {groups.length === 0 && q ? (
        <p className="px-2 py-2 text-xs leading-relaxed text-muted-foreground">
          {DOCS_COPY.noResults(query)}
        </p>
      ) : null}

      <div className="space-y-5">
        {groups.map(({ category, articles: groupArticles }) => {
          const accent = accentClasses[accentForSlug(category.slug)];
          const Icon = iconForSlug(category.slug);
          const open = q ? true : !collapsed.has(category.slug);
          const categoryHref = `/docs/${category.slug}`;
          const isCategoryActive = pathname === categoryHref;

          return (
            <section key={category.slug}>
              <div className="flex items-center gap-1">
                <Link
                  href={categoryHref}
                  onClick={onNavigate}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors",
                    isCategoryActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className={cn("shrink-0", accent.text)}>
                    {category.icon ? (
                      <span className="text-sm leading-none">{category.icon}</span>
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="truncate">{category.title}</span>
                </Link>
                {groupArticles.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => toggle(category.slug)}
                    className="rounded-md p-1 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                    aria-expanded={open}
                    aria-label={`${open ? "طي" : "توسيع"} ${category.title}`}
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        !open && "-rotate-90"
                      )}
                    />
                  </button>
                ) : null}
              </div>

              {open && groupArticles.length > 0 ? (
                <ul className="mt-1 space-y-0.5 border-s border-border/50 ps-3">
                  {groupArticles.map((article) => {
                    const href = `/docs/${category.slug}/${article.slug}`;
                    const isActive = pathname === href;
                    return (
                      <li key={article.slug}>
                        <Link
                          href={href}
                          onClick={onNavigate}
                          className={cn(
                            "block truncate rounded-md px-2 py-1.5 text-[13px] leading-snug transition-colors",
                            isActive
                              ? "bg-primary/10 font-medium text-primary"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          )}
                        >
                          {article.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>
    </nav>
  );
}
