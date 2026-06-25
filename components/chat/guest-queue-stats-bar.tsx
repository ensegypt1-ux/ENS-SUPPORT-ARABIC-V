"use client";

import { cn } from "@/lib/utils";
import type { GuestQueueStats } from "@/lib/chat/guest-queue";

interface GuestQueueStatsBarProps {
  stats: GuestQueueStats;
  className?: string;
}

function StatCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center px-1 py-1.5">
      <span
        className={cn(
          "text-base font-bold tabular-nums leading-none tracking-tight",
          accent && value > 0
            ? "text-amber-700 dark:text-amber-400"
            : "text-foreground"
        )}
      >
        {value}
      </span>
      <span className="mt-1 truncate text-[10px] font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function GuestQueueStatsBar({ stats, className }: GuestQueueStatsBarProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-4 divide-x divide-border/40 overflow-hidden rounded-xl border border-border/50 bg-muted/20 shadow-sm",
        className
      )}
    >
      <StatCell label="جديد" value={stats.newChats} accent={stats.newChats > 0} />
      <StatCell label="بانتظار" value={stats.waiting} accent={stats.waiting > 0} />
      <StatCell label="استلمتها" value={stats.claimedByMe} />
      <StatCell
        label="أولوية"
        value={stats.highPriority}
        accent={stats.highPriority > 0}
      />
    </div>
  );
}
