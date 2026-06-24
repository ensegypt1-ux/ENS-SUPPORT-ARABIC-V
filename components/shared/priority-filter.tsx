"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS = [
  { value: "all", label: "كل الأولويات" },
  { value: "low", label: "منخفضة" },
  { value: "medium", label: "متوسطة" },
  { value: "high", label: "عالية" },
  { value: "urgent", label: "عاجلة" },
];

interface PriorityFilterProps {
  defaultValue?: string;
  className?: string;
}

export function PriorityFilter({ defaultValue, className }: PriorityFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePriorityChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete("priority");
    } else {
      params.set("priority", value);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select
      defaultValue={defaultValue || "all"}
      onValueChange={handlePriorityChange}
    >
      <SelectTrigger className={cn("h-9 w-full text-sm sm:w-[140px]", className)}>
        <SelectValue placeholder="كل الأولويات" />
      </SelectTrigger>
      <SelectContent>
        {PRIORITY_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
