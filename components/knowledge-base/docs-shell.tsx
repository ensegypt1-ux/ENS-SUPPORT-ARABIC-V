"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyInfo } from "@/components/providers/settings-provider";
import type { KBCategory, KBArticle } from "@/types";
import { useAiChatConfig } from "@/components/ai-chat/use-ai-chat-config";
import { requestOpenAiChat } from "@/lib/ai/open-ai-chat";
import { DocsSidebar } from "./docs-sidebar";
import { DocsMobileMenu } from "./docs-mobile-menu";
import { DocsSearchInput, useDocsSearchQuery } from "./docs-search-input";
import { ENS_BRAND } from "@/lib/ens-brand";
import { DOCS_COPY } from "@/lib/docs-copy";

interface DocsShellProps {
  categories: Array<KBCategory & { articleCount: number }>;
  articles: KBArticle[];
  children: React.ReactNode;
}

const docsContainerClass =
  "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:max-w-7xl lg:px-8";

export function DocsShell({ categories, articles, children }: DocsShellProps) {
  const pathname = usePathname();
  const query = useDocsSearchQuery();
  const { siteName } = useCompanyInfo();
  const aiConfig = useAiChatConfig();
  const showAskAi = aiConfig?.enabled === true;
  const isHome = pathname === "/docs";

  return (
    <div dir="rtl">
      {/* Sub-header */}
      <div className="sticky top-16 z-40 border-b border-border/70 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85">
        <div className={cn(docsContainerClass, "py-3")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <DocsMobileMenu categories={categories} articles={articles} />
              <Link
                href="/docs"
                className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
              >
                <BookOpen className="hidden h-4 w-4 shrink-0 lg:block" />
                <span className="truncate">
                  {siteName || ENS_BRAND.portalTitle}
                </span>
                <span className="hidden text-muted-foreground sm:inline">
                  · {DOCS_COPY.breadcrumb.docs}
                </span>
              </Link>
            </div>

            {!isHome ? (
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md lg:max-w-lg">
                <DocsSearchInput variant="compact" className="flex-1" />
              </div>
            ) : null}

            {showAskAi ? (
              <button
                type="button"
                onClick={requestOpenAiChat}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 sm:px-4"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">{DOCS_COPY.askAi}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={cn(
          docsContainerClass,
          "grid grid-cols-1 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,16.5rem)_minmax(0,1fr)]"
        )}
      >
        <aside className="hidden border-e border-border/60 lg:block">
          <div className="sticky top-[7.25rem] max-h-[calc(100dvh-7.25rem)] overflow-y-auto">
            <DocsSidebar
              categories={categories}
              articles={articles}
              query={query}
            />
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
