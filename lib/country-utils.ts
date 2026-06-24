import { COUNTRIES } from "@/lib/constants/countries";

const regionNames =
  typeof Intl !== "undefined"
    ? new Intl.DisplayNames(["ar"], { type: "region" })
    : null;

/** Arabic display name for an ISO country code. */
export function getCountryNameAr(code: string): string {
  if (regionNames) {
    const name = regionNames.of(code);
    if (name) return name;
  }
  const fallback = COUNTRIES.find((c) => c.code === code);
  return fallback?.name ?? code;
}

/** Lookup Arabic country name by stored English name or ISO code. */
export function resolveCountryDisplayName(stored: string | undefined | null): string {
  if (!stored?.trim()) return "—";
  const trimmed = stored.trim();
  const byCode = COUNTRIES.find(
    (c) => c.code.toUpperCase() === trimmed.toUpperCase()
  );
  if (byCode) return getCountryNameAr(byCode.code);
  const byEnglish = COUNTRIES.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (byEnglish) return getCountryNameAr(byEnglish.code);
  return trimmed;
}

export function getCountriesForCombobox() {
  return COUNTRIES.map((country) => ({
    code: country.code,
    value: country.name,
    label: getCountryNameAr(country.code),
    keywords: [country.code, country.name],
  })).sort((a, b) => a.label.localeCompare(b.label, "ar"));
}
