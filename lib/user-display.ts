import { ENS_BRAND } from "@/lib/ens-brand";

/** Shared inboxes — show company name instead of a personal profile label. */
const GENERIC_MAILBOX_LOCALS = new Set([
  "info",
  "support",
  "contact",
  "admin",
  "sales",
  "hello",
  "help",
  "noreply",
  "no-reply",
  "mail",
  "office",
]);

function firstGrapheme(text: string, locale = "ar"): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(locale, { granularity: "grapheme" });
    const first = [...segmenter.segment(trimmed)][0]?.segment;
    if (first) return first;
  }

  return [...trimmed][0] ?? "";
}

function graphemes(text: string, limit: number, locale = "ar"): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(locale, { granularity: "grapheme" });
    return [...segmenter.segment(trimmed)]
      .map((part) => part.segment)
      .slice(0, limit)
      .join("");
  }

  return trimmed.slice(0, limit);
}

function formatEmailLocal(local: string): string {
  if (!local) return "مستخدم";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/** Resolve the label shown in headers, menus, and avatars. */
export function resolveUserDisplayName(
  name: string | null | undefined,
  email?: string | null,
  companyName?: string | null,
): string {
  const trimmed = (name ?? "").trim();
  const localPart = email?.split("@")[0]?.trim().toLowerCase() ?? "";
  const company = (companyName ?? ENS_BRAND.companyName).trim();

  if (localPart && GENERIC_MAILBOX_LOCALS.has(localPart)) {
    return company || trimmed || formatEmailLocal(localPart);
  }

  if (!trimmed) {
    return company || formatEmailLocal(localPart) || "مستخدم";
  }

  return trimmed;
}

/** Avatar initials — grapheme-aware for Arabic and Latin names. */
export function getUserInitials(
  name: string | null | undefined,
  email?: string | null,
  companyName?: string | null,
): string {
  const displayName = resolveUserDisplayName(name, email, companyName);
  const parts = displayName.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return (firstGrapheme(parts[0]) + firstGrapheme(parts[1])).slice(0, 2);
  }

  return graphemes(parts[0] ?? displayName, 2);
}
