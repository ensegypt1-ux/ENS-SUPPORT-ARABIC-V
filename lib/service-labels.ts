/** Arabic display names for built-in service slugs (fallback when DB name is English). */
const SERVICE_LABELS_AR: Record<string, string> = {
  customization: "التخصيص",
  installation: "التثبيت",
};

const ENGLISH_SERVICE_NAMES = new Set([
  "customization",
  "installation",
  "Customization",
  "Installation",
]);

export function getServiceDisplayName(slug: string, name: string): string {
  if (SERVICE_LABELS_AR[slug]) {
    if (!name?.trim() || ENGLISH_SERVICE_NAMES.has(name.trim())) {
      return SERVICE_LABELS_AR[slug];
    }
  }
  return name;
}
