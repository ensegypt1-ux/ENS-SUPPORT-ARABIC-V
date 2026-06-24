import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/** Standard admin table column header — RTL-native, no English micro-label styling. */
export const adminTableHeadClass =
  "h-12 px-4 text-xs font-semibold text-muted-foreground/80 text-start";

/** Arabic-native section label — no uppercase tracking (English SaaS pattern). */
export function PageSectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-xs font-semibold text-muted-foreground text-start leading-relaxed",
        className
      )}
    >
      {children}
    </h2>
  );
}

/** Sidebar / detail metadata field label */
export function DetailFieldLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-1.5 text-xs font-semibold text-muted-foreground text-start",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Form card section title with optional leading icon (RTL). */
export function FormSectionTitle({
  icon,
  title,
  description,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1 text-start", className)}>
      <div className="flex flex-row items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold leading-snug">{title}</h2>
      </div>
      {description ? (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      ) : null}
    </div>
  );
}

/** Inline search field with icon on the start side (RTL-safe). */
export function LocalSearchField({
  value,
  onChange,
  placeholder = "بحث...",
  className,
  inputClassName,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("h-11 ps-10 text-start", inputClassName)}
      />
    </div>
  );
}

/** Meta line under page titles: «فتحها … • آخر نشاط …» */
export function PageMetaLine({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground text-start",
        className
      )}
    >
      {children}
    </div>
  );
}

export function MetaSeparator() {
  return <span className="text-muted-foreground/50" aria-hidden="true">•</span>;
}

/** Table/detail cell: text with icon on the right (physical RTL). */
export function RtlIconText({
  icon,
  children,
  className,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex w-full min-w-0 flex-row items-center justify-end gap-2",
        className
      )}
      dir="ltr"
    >
      <span className="min-w-0 truncate text-start" dir="auto">
        {children}
      </span>
      <span className="shrink-0 text-muted-foreground">{icon}</span>
    </div>
  );
}

/** Detail dialog field label + value block. */
export function DetailField({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1 text-right", className)} dir="rtl">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div>{children}</div>
    </div>
  );
}

/** RTL admin tab bar — first tab on the right, scrolls horizontally. */
export const adminTabsScrollClass = "overflow-x-auto";

export const adminTabsListClass =
  "inline-flex h-auto w-max min-w-full flex-wrap justify-start gap-1 rounded-xl bg-muted/50 p-1.5 lg:min-w-0";

/** Tab pill: label then icon (icon physically on the right). */
export const adminTabTriggerClass =
  "inline-flex h-auto flex-none flex-row items-center justify-end gap-2 rounded-lg border-transparent px-4 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm";
