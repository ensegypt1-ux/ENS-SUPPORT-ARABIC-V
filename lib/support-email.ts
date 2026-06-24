const PLACEHOLDER_EMAIL_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "demo.com",
]);

/** True when the address is empty or uses a known placeholder domain. */
export function isPlaceholderEmail(email: string | undefined | null): boolean {
  const trimmed = email?.trim();
  if (!trimmed) return true;

  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex <= 0) return true;

  const domain = trimmed.slice(atIndex + 1).toLowerCase();
  return PLACEHOLDER_EMAIL_DOMAINS.has(domain);
}

/** Support email safe to show on public pages; undefined when unset or placeholder. */
export function resolvePublicSupportEmail(
  email: string | undefined | null,
): string | undefined {
  const trimmed = email?.trim();
  if (!trimmed || isPlaceholderEmail(trimmed)) return undefined;
  return trimmed;
}
