"use client";

import { useMemo, useState } from "react";
import getUnicodeFlagIcon from "country-flag-icons/unicode";
import { ChevronsUpDown } from "lucide-react";
import type { Country } from "react-phone-number-input";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type CountryOption = {
  value?: Country;
  label: string;
  divider?: boolean;
};

interface PhoneCountrySelectProps {
  value?: Country;
  onChange: (country?: Country) => void;
  options: CountryOption[];
  disabled?: boolean;
  readOnly?: boolean;
}

export function PhoneCountrySelect({
  value,
  onChange,
  options,
  disabled,
  readOnly,
}: PhoneCountrySelectProps) {
  const [open, setOpen] = useState(false);

  const countries = useMemo(
    () => options.filter((option) => !option.divider && option.value),
    [options]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="اختر الدولة"
          disabled={disabled || readOnly}
          className="h-10 shrink-0 gap-1.5 rounded-lg px-2.5 font-normal"
        >
          <span className="text-base leading-none">
            {value ? getUnicodeFlagIcon(value) : "🌐"}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-2rem,18rem)] p-0" align="start">
        <Command>
          <CommandInput placeholder="ابحث عن دولة…" />
          <CommandList>
            <CommandEmpty>لا توجد نتائج</CommandEmpty>
            <CommandGroup>
              {countries.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <span className="text-base leading-none">
                    {option.value ? getUnicodeFlagIcon(option.value) : ""}
                  </span>
                  <span className="flex-1 truncate">{option.label}</span>
                  <span
                    className={cn(
                      "text-xs text-muted-foreground",
                      value === option.value && "font-medium text-foreground"
                    )}
                  >
                    {option.value}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
