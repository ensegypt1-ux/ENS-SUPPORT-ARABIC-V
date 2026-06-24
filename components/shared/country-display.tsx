import { resolveCountryDisplayName } from "@/lib/country-utils";

interface CountryDisplayProps {
  name?: string | null;
  className?: string;
}

export function CountryDisplay({ name, className }: CountryDisplayProps) {
  if (!name?.trim()) {
    return <span className={className}>—</span>;
  }
  return <span className={className}>{resolveCountryDisplayName(name)}</span>;
}
