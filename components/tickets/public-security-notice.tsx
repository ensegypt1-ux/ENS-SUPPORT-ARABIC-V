"use client";

import { cn } from "@/lib/utils";
import {
  Shield,
  KeyRound,
  Smartphone,
  CreditCard,
  ImageIcon,
  CircleSlash,
} from "lucide-react";
import { PUBLIC_SECURITY_NOTICE } from "@/lib/strings";

const chipIcons = {
  key: KeyRound,
  phone: Smartphone,
  card: CreditCard,
  image: ImageIcon,
} as const;

type PublicSecurityNoticeProps = {
  variant?: "default" | "compact";
  className?: string;
};

export function PublicSecurityNotice({
  variant = "default",
  className,
}: PublicSecurityNoticeProps) {
  const copy = PUBLIC_SECURITY_NOTICE;

  if (variant === "compact") {
    return (
      <div
        role="note"
        aria-label={copy.ariaLabel}
        dir="rtl"
        className={cn(
          "flex gap-3 rounded-xl border border-rose-200/60 bg-gradient-to-l from-rose-50/80 to-rose-50/40 p-3.5 sm:p-4",
          "dark:border-rose-900/35 dark:from-rose-950/30 dark:to-rose-950/10",
          className
        )}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
          aria-hidden
        >
          <Shield className="h-4 w-4" />
        </span>
        <p className="text-xs leading-relaxed text-rose-950/85 dark:text-rose-100/85 sm:text-[13px]">
          {copy.compact}
        </p>
      </div>
    );
  }

  return (
    <aside
      role="note"
      aria-label={copy.ariaLabel}
      dir="rtl"
      className={cn(
        "overflow-hidden rounded-2xl border border-rose-200/55 bg-gradient-to-l from-rose-50/90 via-rose-50/50 to-background/40",
        "shadow-sm shadow-rose-900/[0.03] dark:border-rose-900/35 dark:from-rose-950/25 dark:via-rose-950/10 dark:to-background/20",
        className
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-5 sm:p-5">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100/90 text-rose-700 ring-1 ring-rose-200/60 dark:bg-rose-900/35 dark:text-rose-300 dark:ring-rose-800/40"
          aria-hidden
        >
          <Shield className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-rose-950 dark:text-rose-50 sm:text-[15px]">
              {copy.title}
            </h3>
            <p className="text-xs leading-relaxed text-rose-900/75 dark:text-rose-200/75 sm:text-[13px]">
              {copy.intro}
            </p>
          </div>

          <p className="text-xs leading-[1.7] text-foreground/80 sm:text-[13px]">
            {copy.body}
          </p>

          <ul
            className="flex flex-wrap gap-1.5 sm:gap-2"
            aria-label="معلومات لا يجب مشاركتها"
          >
            {copy.chips.map((chip) => {
              const Icon = chipIcons[chip.icon];
              return (
                <li key={chip.id}>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/70 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-rose-900/90 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-100/90 sm:px-3 sm:text-xs">
                    <CircleSlash
                      className="h-3 w-3 shrink-0 text-rose-500 dark:text-rose-400"
                      aria-hidden
                    />
                    <Icon className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                    {chip.label}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
            {copy.footer}
          </p>
        </div>
      </div>
    </aside>
  );
}
