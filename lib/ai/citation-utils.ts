import type { AIChatSource, AIKnowledgeSearchResult } from "@/types";

/** Internal chunk suffixes added at index time — never show these to users. */
const PART_SUFFIX_RE = /\s*\((?:part|جزء)\s+\d+\)\s*$/i;

/** Strip internal chunk labels from indexed titles. */
export function formatCitationTitle(title: string): string {
  return title.replace(PART_SUFFIX_RE, "").trim();
}

/** Public docs path for a published KB article. */
export function kbArticlePublicPath(
  categorySlug: string,
  articleSlug: string
): string {
  return `/docs/${encodeURIComponent(categorySlug)}/${encodeURIComponent(articleSlug)}`;
}

/** Normalize URLs for deduplication (trailing slash, hash, etc.). */
export function normalizeCitationUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  try {
    const absolute = trimmed.startsWith("http") ? trimmed : `http://local${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
    const u = new URL(absolute);
    u.hash = "";
    u.pathname = u.pathname.replace(/\/+$/, "") || "/";
    if (trimmed.startsWith("http")) {
      return `${u.origin}${u.pathname}${u.search}`;
    }
    return `${u.pathname}${u.search}`;
  } catch {
    return trimmed.split("#")[0].replace(/\/+$/, "") || trimmed;
  }
}

/**
 * Build one user-facing citation from a search hit. Returns null when the row
 * has no public URL (e.g. unresolved file chunks).
 */
export function buildCitationFromResult(
  r: Pick<AIKnowledgeSearchResult, "title" | "url" | "sourceType" | "sourceId">,
  webSourceNames?: ReadonlyMap<string, string>
): AIChatSource | null {
  const url = r.url?.trim();
  if (!url) return null;

  let title = formatCitationTitle(r.title || "");
  if (!title || title === url) {
    if (r.sourceType === "web_page") {
      const wsId = r.sourceId.split(":")[0];
      title = (wsId && webSourceNames?.get(wsId)) || title || url;
    } else {
      title = title || url;
    }
  }

  return { title, url };
}

/**
 * Collapse duplicate citations: same normalized URL or same clean title.
 * Keeps first-seen order (highest retrieval rank).
 */
export function dedupeCitationSources(
  sources: AIChatSource[],
  max = 3
): AIChatSource[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const out: AIChatSource[] = [];

  for (const raw of sources) {
    const title = formatCitationTitle(raw.title) || raw.url;
    const urlKey = normalizeCitationUrl(raw.url);
    const titleKey = title.toLowerCase();

    if (seenUrls.has(urlKey)) continue;
    if (seenTitles.has(titleKey)) continue;

    seenUrls.add(urlKey);
    seenTitles.add(titleKey);
    out.push({ title, url: raw.url });
    if (out.length >= max) break;
  }

  return out;
}
