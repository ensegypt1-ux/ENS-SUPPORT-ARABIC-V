import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import {
  getPublishedKBCategories,
  getPublishedKBArticles,
} from "@/actions/knowledge-base";
import { cn } from "@/lib/utils";
import {
  accentClasses,
  accentForSlug,
  iconForSlug,
} from "@/components/knowledge-base/docs-theme";
import { DocsSupportStrip } from "@/components/knowledge-base/docs-support-strip";
import { DOCS_COPY } from "@/lib/docs-copy";
import { homeVisual } from "@/lib/home-visual";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ categorySlug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { categorySlug } = await params;

  const [categoriesResult, articlesResult] = await Promise.all([
    getPublishedKBCategories(),
    getPublishedKBArticles(categorySlug),
  ]);

  const category = categoriesResult.data?.find((c) => c.slug === categorySlug);
  if (!category) notFound();

  const articles = articlesResult.data ?? [];
  const accent = accentClasses[accentForSlug(category.slug)];
  const Icon = iconForSlug(category.slug);

  return (
    <article
      className={cn(
        homeVisual.pageX,
        "mx-auto w-full max-w-3xl py-8 lg:max-w-4xl lg:py-10 xl:max-w-5xl"
      )}
      dir="rtl"
    >
      <nav
        className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
        aria-label="مسار التنقل"
      >
        <Link href="/docs" className="transition-colors hover:text-foreground">
          {DOCS_COPY.breadcrumb.docs}
        </Link>
        <span aria-hidden className="text-border">
          /
        </span>
        <span className="font-medium text-foreground">{category.title}</span>
      </nav>

      <header className="mt-6 flex items-start gap-4">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            accent.soft,
            accent.text
          )}
        >
          {category.icon ? (
            <span className="text-xl leading-none">{category.icon}</span>
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {category.title}
          </h1>
          {category.description ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {category.description}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {DOCS_COPY.articleCount(category.articleCount ?? articles.length)}
          </p>
        </div>
      </header>

      {articles.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-border/70 bg-muted/20 px-5 py-10 text-center text-sm text-muted-foreground">
          {DOCS_COPY.emptyCategory}
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border/50 rounded-2xl border border-border/60 bg-card">
          {articles.map((article) => (
            <li key={article.slug}>
              <Link
                href={`/docs/${categorySlug}/${article.slug}`}
                className="group flex items-start gap-3 px-4 py-4 transition-colors hover:bg-muted/30 sm:px-5"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground group-hover:text-primary sm:text-[15px]">
                    {article.title}
                  </span>
                  {article.excerpt ? (
                    <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {article.excerpt}
                    </span>
                  ) : null}
                </span>
                <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground opacity-60 transition-transform group-hover:-translate-x-0.5 group-hover:text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <DocsSupportStrip />
    </article>
  );
}
