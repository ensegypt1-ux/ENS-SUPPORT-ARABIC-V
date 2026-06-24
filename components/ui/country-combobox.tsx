"use client";

import {
  Combobox,
  type ComboboxGroup,
  type ComboboxProps,
} from "@/components/ui/combobox";
import { getCountriesForCombobox } from "@/lib/country-utils";

const COUNTRY_GROUPS: ComboboxGroup[] = getCountriesForCombobox().reduce<
  ComboboxGroup[]
>((groups, country) => {
  const heading = country.label[0] || "#";
  const currentGroup = groups[groups.length - 1];

  if (!currentGroup || currentGroup.heading !== heading) {
    groups.push({ heading, options: [] });
  }

  groups[groups.length - 1].options.push({
    value: country.value,
    label: country.label,
    keywords: country.keywords,
  });

  return groups;
}, []);

export type CountryComboboxProps = Omit<
  ComboboxProps,
  "emptyMessage" | "groups" | "options" | "searchPlaceholder"
> & {
  emptyMessage?: string;
  searchPlaceholder?: string;
};

export function CountryCombobox({
  placeholder = "اختر الدولة",
  searchPlaceholder = "بحث في الدول...",
  emptyMessage = "ملقيناش دولة.",
  portalled = true,
  ...props
}: CountryComboboxProps) {
  return (
    <Combobox
      groups={COUNTRY_GROUPS}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      portalled={portalled}
      {...props}
    />
  );
}
