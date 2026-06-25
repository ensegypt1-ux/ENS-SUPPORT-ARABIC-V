import { Suspense } from "react";
import { toPlainObject } from "@/lib/serialization";
import {
  getPublishedKBCategories,
  getAllPublishedArticlesForNav,
} from "@/actions/knowledge-base";
import { DocsHomeView } from "@/components/knowledge-base/docs-home-view";

export const dynamic = "force-dynamic";

function HomeFallback() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:max-w-4xl" dir="rtl">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="mt-4 h-12 w-full animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

export default async function DocsHomePage() {
  const [categoriesResult, articlesResult] = await Promise.all([
    getPublishedKBCategories(),
    getAllPublishedArticlesForNav(),
  ]);

  const categories = toPlainObject(categoriesResult.data ?? []);
  const articles = toPlainObject(articlesResult.data ?? []);

  return (
    <Suspense fallback={<HomeFallback />}>
      <DocsHomeView categories={categories} articles={articles} />
    </Suspense>
  );
}
