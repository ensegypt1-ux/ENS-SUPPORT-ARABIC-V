"use client";

import {
  GUEST_PRIORITY_LABELS,
  type GuestQueuePriority,
} from "@/lib/chat/guest-queue";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<GuestQueuePriority, string> = {
  normal:
    "bg-muted text-muted-foreground border-border/60",
  medium:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900",
  high:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  urgent:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
};

export function GuestPriorityBadge({
  priority,
  className,
}: {
  priority: GuestQueuePriority;
  className?: string;
}) {
  if (priority === "normal") return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none",
        PRIORITY_STYLES[priority],
        className
      )}
    >
      {GUEST_PRIORITY_LABELS[priority]}
    </span>
  );
}

export function getPriorityRowClass(priority: GuestQueuePriority) {
  if (priority === "urgent") {
    return "border-s-2 border-s-red-500 bg-red-50/50 dark:bg-red-950/20";
  }
  if (priority === "high") {
    return "border-s-2 border-s-amber-500 bg-amber-50/40 dark:bg-amber-950/15";
  }
  return "";
}
