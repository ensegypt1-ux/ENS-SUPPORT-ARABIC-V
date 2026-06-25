import { Suspense } from "react";
import { toPlainObject } from "@/lib/serialization";
import { PublicHeader } from "@/components/layout/public-header";
import { DocsShell } from "@/components/knowledge-base/docs-shell";
import { DocsThemeToggle } from "@/components/knowledge-base/docs-theme-toggle";
import {
  getPublishedKBCategories,
  getAllPublishedArticlesForNav,
} from "@/actions/knowledge-base";

function DocsShellFallback() {
  return <div className="min-h-[50vh] bg-background" dir="rtl" />;
}

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categoriesResult, articlesResult] = await Promise.all([
    getPublishedKBCategories(),
    getAllPublishedArticlesForNav(),
  ]);

  const categories = toPlainObject(categoriesResult.data ?? []);
  const articles = toPlainObject(articlesResult.data ?? []);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PublicHeader />
      <Suspense fallback={<DocsShellFallback />}>
        <DocsShell categories={categories} articles={articles}>
          {children}
        </DocsShell>
      </Suspense>
      <DocsThemeToggle />
    </div>
  );
}
