"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TicketPriority, TicketStatus } from "@/types";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/strings";

interface FilterOption {
  value: string;
  label: string;
}

interface GlobalFiltersProps {
  defaultValues?: {
    status?: string;
    priority?: string;
    search?: string;
  };
  searchPlaceholder?: string;
  showStatus?: boolean;
  showPriority?: boolean;
  statusOptions?: FilterOption[];
  priorityOptions?: FilterOption[];
}

const STATUS_ORDER: TicketStatus[] = [
  "open",
  "scheduled_meeting",
  "in_progress",
  "waiting_on_customer",
  "resolved",
  "closed",
];

const PRIORITY_ORDER: TicketPriority[] = ["low", "medium", "high", "urgent"];

const DEFAULT_STATUS_OPTIONS: FilterOption[] = [
  { value: "all", label: "كل الحالات" },
  ...STATUS_ORDER.map((value) => ({
    value,
    label: STATUS_LABELS[value],
  })),
];

const DEFAULT_PRIORITY_OPTIONS: FilterOption[] = [
  { value: "all", label: "كل الأولويات" },
  ...PRIORITY_ORDER.map((value) => ({
    value,
    label: PRIORITY_LABELS[value],
  })),
];

export function GlobalFilters({
  defaultValues,
  searchPlaceholder = "دور...",
  showStatus = true,
  showPriority = true,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  priorityOptions = DEFAULT_PRIORITY_OPTIONS,
}: GlobalFiltersProps) {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;
    const status = formData.get("status") as string;
    const priority = formData.get("priority") as string;

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status && status !== "all") params.set("status", status);
    if (priority && priority !== "all") params.set("priority", priority);

    router.push(`?${params.toString()}`);
  };

  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-1">
          <Filter className="h-4 w-4" />
          فلتر
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-4"
        >
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="search"
                placeholder={searchPlaceholder}
                defaultValue={defaultValues?.search}
                className="ps-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          {showStatus && (
            <div className="w-full sm:w-auto sm:min-w-[180px]">
              <Select
                name="status"
                defaultValue={defaultValues?.status || "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={statusOptions[0].label} />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority Filter */}
          {showPriority && (
            <div className="w-full sm:w-auto sm:min-w-[180px]">
              <Select
                name="priority"
                defaultValue={defaultValues?.priority || "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={priorityOptions[0].label} />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filter Button */}
          <div className="w-full sm:w-auto">
            <Button type="submit" className="w-full sm:w-auto">
              طبّق
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Backward compatibility - keep TicketFilters as an alias
export function TicketFilters(
  props: Omit<GlobalFiltersProps, "searchPlaceholder">
) {
  return <GlobalFilters {...props} searchPlaceholder="دور في التذاكر..." />;
}
