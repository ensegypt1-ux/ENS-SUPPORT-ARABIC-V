import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, ArrowLeft, ArrowRight } from "lucide-react";
import {
  getPublishedKBArticle,
  getPublishedKBCategories,
  getAllPublishedArticlesForNav,
} from "@/actions/knowledge-base";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ArticleToc,
  type TocHeading,
} from "@/components/knowledge-base/article-toc";
import { DocsFeedback } from "@/components/knowledge-base/docs-aside";
import { DocsSupportStrip } from "@/components/knowledge-base/docs-support-strip";
import {
  accentClasses,
  accentForSlug,
  iconForSlug,
} from "@/components/knowledge-base/docs-theme";
import { DOCS_COPY } from "@/lib/docs-copy";
import { homeVisual } from "@/lib/home-visual";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ categorySlug: string; articleSlug: string }>;
}

function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function processContent(html: string): {
  content: string;
  headings: TocHeading[];
} {
  const headings: TocHeading[] = [];
  const idCount: Record<string, number> = {};

  const content = html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (_match, level, attrs, inner) => {
      const text = inner.replace(/<[^>]*>/g, "").trim();
      let id = slugifyHeading(text);
      if (!id) id = `heading-${headings.length}`;
      if (idCount[id] !== undefined) {
        idCount[id]++;
        id = `${id}-${idCount[id]}`;
      } else {
        idCount[id] = 0;
      }
      headings.push({ id, text, level: parseInt(level) });
      return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
    }
  );

  return { content, headings };
}

export default async function ArticlePage({ params }: PageProps) {
  const { categorySlug, articleSlug } = await params;

  const [articleResult, categoriesResult, allArticlesResult] =
    await Promise.all([
      getPublishedKBArticle(categorySlug, articleSlug),
      getPublishedKBCategories(),
      getAllPublishedArticlesForNav(),
    ]);

  if (!articleResult.success || !articleResult.data) notFound();

  const article = articleResult.data;
  const category = categoriesResult.data?.find((c) => c.slug === categorySlug);
  const { content, headings } = processContent(article.content);

  const accent = accentClasses[accentForSlug(category?.slug ?? categorySlug)];
  const Icon = iconForSlug(category?.slug ?? categorySlug);

  const categoryArticles = (allArticlesResult.data ?? []).filter(
    (a) => a.categorySlug === categorySlug
  );
  const currentIndex = categoryArticles.findIndex(
    (a) => a.slug === articleSlug
  );
  const prevArticle = currentIndex > 0 ? categoryArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex < categoryArticles.length - 1
      ? categoryArticles[currentIndex + 1]
      : null;

  return (
    <div
      className={cn(
        homeVisual.pageX,
        "mx-auto grid w-full max-w-6xl gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_12.5rem] lg:py-10 xl:grid-cols-[minmax(0,1fr)_14rem]"
      )}
      dir="rtl"
    >
      <article className="min-w-0">
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
          {category ? (
            <>
              <Link
                href={`/docs/${categorySlug}`}
                className="transition-colors hover:text-foreground"
              >
                {category.title}
              </Link>
              <span aria-hidden className="text-border">
                /
              </span>
            </>
          ) : null}
          <span className="max-w-[12rem] truncate font-medium text-foreground sm:max-w-xs">
            {article.title}
          </span>
        </nav>

        <header className="mt-6 flex items-start gap-4">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              accent.soft,
              accent.text
            )}
          >
            {category?.icon ? (
              <span className="text-lg leading-none">{category.icon}</span>
            ) : (
              <Icon className="h-5 w-5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {article.title}
            </h1>
            {article.excerpt ? (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {article.excerpt}
              </p>
            ) : null}
          </div>
        </header>

        <div className="mt-5 flex items-center gap-2 border-b border-border/60 pb-6 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {DOCS_COPY.meta.updated}{" "}
            {format(new Date(article.updatedAt), "MMM d, yyyy")}
          </span>
        </div>

        <div
          className="prose prose-sm md:prose-base max-w-none dark:prose-invert
            prose-headings:font-semibold prose-headings:tracking-tight prose-headings:scroll-mt-36
            prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
            prose-p:leading-7 prose-p:text-foreground/90
            prose-a:text-primary prose-a:no-underline prose-a:font-medium hover:prose-a:underline
            prose-strong:text-foreground prose-strong:font-semibold
            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md
            prose-code:text-[13px] prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-slate-950 prose-pre:text-slate-100 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl
            prose-blockquote:border-s-4 prose-blockquote:border-primary/50 prose-blockquote:bg-muted/30 prose-blockquote:rounded-e-lg prose-blockquote:py-0.5 prose-blockquote:text-muted-foreground prose-blockquote:not-italic
            prose-ul:my-4 prose-li:my-1
            prose-img:rounded-xl prose-img:border prose-img:border-border"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {(prevArticle || nextArticle) && (
          <div className="mt-12 grid grid-cols-1 gap-3 border-t border-border/60 pt-8 sm:grid-cols-2">
            {prevArticle ? (
              <Link
                href={`/docs/${categorySlug}/${prevArticle.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-colors hover:border-primary/25 hover:bg-muted/20"
              >
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block text-[11px] text-muted-foreground">
                    {DOCS_COPY.nav.previous}
                  </span>
                  <span className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
                    {prevArticle.title}
                  </span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {nextArticle ? (
              <Link
                href={`/docs/${categorySlug}/${nextArticle.slug}`}
                className="group flex items-center justify-end gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-end transition-colors hover:border-primary/25 hover:bg-muted/20"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] text-muted-foreground">
                    {DOCS_COPY.nav.next}
                  </span>
                  <span className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
                    {nextArticle.title}
                  </span>
                </span>
                <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ) : null}
          </div>
        )}

        <div className="mt-8 space-y-6">
          <DocsFeedback />
          <DocsSupportStrip />
        </div>
      </article>

      {headings.length > 0 ? (
        <aside className="hidden lg:block">
          <div className="sticky top-36">
            <ArticleToc headings={headings} />
          </div>
        </aside>
      ) : null}
    </div>
  );
}
