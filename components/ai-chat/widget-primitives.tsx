"use client";

import type { CSSProperties, ReactNode, Ref } from "react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetTheme } from "@/lib/ai/widget-theme";

export function formatWidgetTime(value: number | string): string {
  const date =
    typeof value === "number" ? new Date(value) : new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function WidgetShell({
  children,
  className,
  style,
  embedded,
  sizeMode,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  embedded?: boolean;
  sizeMode?: "fixed" | "configured";
}) {
  return (
    <div
      className={cn(
        "widget-shell flex flex-col overflow-hidden bg-background",
        "rounded-[20px] border border-border/40",
        "shadow-[0_16px_48px_-20px_rgba(15,23,42,0.28)] ring-1 ring-black/[0.03]",
        embedded
          ? "h-full max-h-full w-full"
          : sizeMode === "configured"
            ? "max-w-full"
            : "h-[38rem] max-h-[calc(100vh-5rem)] w-[25rem]",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export function WidgetHeader({
  theme,
  title,
  subtitle,
  avatarUrl,
  avatarFallback,
  onClose,
  statusDot,
}: {
  theme: WidgetTheme;
  title: string;
  subtitle?: ReactNode;
  avatarUrl?: string;
  avatarFallback: ReactNode;
  onClose: () => void;
  statusDot?: "online" | "away" | "offline" | "connecting";
}) {
  return (
    <header
      className="relative shrink-0 overflow-hidden px-4 pb-3.5 pt-3.5 text-white"
      style={{ background: theme.headerGradient }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.16),transparent_52%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_40%)]" />

      <div className="relative flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: theme.headerGradient }}
            >
              {avatarFallback}
            </div>
          )}
          {statusDot && (
            <span
              className={cn(
                "absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full border-2 border-white/90",
                statusDot === "online" && "bg-emerald-400",
                statusDot === "away" && "bg-amber-300",
                statusDot === "connecting" && "bg-amber-300 animate-pulse",
                statusDot === "offline" && "bg-white/50"
              )}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold leading-snug tracking-tight">
            {title}
          </h2>
          {subtitle ? (
            <div className="mt-1 text-[11px] font-medium leading-none text-white/88">
              {subtitle}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          title="إغلاق"
          aria-label="إغلاق المحادثة"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/12 text-white transition-all duration-200 hover:bg-white/22 active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

export function WidgetScrollArea({
  children,
  scrollRef,
  className,
}: {
  children: ReactNode;
  scrollRef?: Ref<HTMLDivElement>;
  className?: string;
}) {
  return (
    <div
      ref={scrollRef}
      className={cn(
        "widget-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain",
        className
      )}
    >
      {children}
    </div>
  );
}

export function WidgetComposer({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  placeholder,
  disabled,
  loading,
  theme,
  inputRef,
  maxLength = 500,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  theme: WidgetTheme;
  inputRef?: Ref<HTMLTextAreaElement>;
  maxLength?: number;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
      }}
      className="flex flex-row-reverse items-end gap-2 rounded-[18px] border border-border/50 bg-background/90 p-1.5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] transition-all duration-200 focus-within:border-primary/30 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label="رسالة المحادثة"
        dir="rtl"
        className="widget-composer-input min-h-[26px] max-h-28 min-w-0 flex-1 resize-none overflow-hidden bg-transparent py-2 text-start text-[13px] leading-[1.55] text-foreground caret-foreground outline-none placeholder:text-muted-foreground/65"
        disabled={disabled || loading}
        maxLength={maxLength}
        autoComplete="off"
        rows={1}
      />
      <button
        type="submit"
        aria-label="إرسال الرسالة"
        title="إرسال الرسالة"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] text-white shadow-[0_4px_14px_-4px_rgba(15,23,42,0.35)] transition-all duration-200 enabled:hover:brightness-110 enabled:active:scale-[0.96] disabled:opacity-35"
        style={{ backgroundColor: theme.sendButton }}
        disabled={disabled || loading || !value.trim()}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 rtl:-scale-x-100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        )}
      </button>
    </form>
  );
}

export function WidgetActionCard({
  icon,
  title,
  description,
  onClick,
  disabled,
  accent,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "widget-action-card group flex w-full items-start gap-3 rounded-[16px] border border-border/45 bg-background p-3 text-start",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200",
        "hover:border-border/70 hover:bg-muted/25 hover:shadow-[0_4px_16px_-8px_rgba(15,23,42,0.12)]",
        "active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45"
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-white shadow-sm"
        style={{ backgroundColor: accent || "var(--primary)" }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="block text-[13px] font-semibold leading-snug text-foreground">
          {title}
        </span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

export function WidgetEmptyState({
  icon,
  title,
  description,
  tone = "default",
}: {
  icon: ReactNode;
  title: string;
  description: string;
  tone?: "default" | "waiting" | "success" | "offline";
}) {
  return (
    <div className="widget-empty-state flex flex-col items-center justify-center px-6 py-10 text-center">
      <div
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-[16px] shadow-sm ring-1",
          tone === "waiting" && "bg-amber-500/10 text-amber-700 ring-amber-500/15",
          tone === "success" && "bg-emerald-500/10 text-emerald-700 ring-emerald-500/15",
          tone === "offline" && "bg-muted text-muted-foreground ring-border/40",
          tone === "default" && "bg-primary/10 text-primary ring-primary/12"
        )}
      >
        {icon}
      </div>
      <p className="text-[14px] font-semibold tracking-tight text-foreground">
        {title}
      </p>
      <p className="mt-1.5 max-w-[240px] text-[12px] leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function WidgetInlineNotice({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "error" | "success" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-[14px] px-3 py-2 text-center text-[11px] leading-relaxed",
        tone === "muted" && "border border-border/40 bg-muted/35 text-muted-foreground",
        tone === "error" && "border border-destructive/20 bg-destructive/8 text-destructive",
        tone === "success" && "border border-emerald-500/20 bg-emerald-500/8 text-emerald-800",
        tone === "warning" && "border border-amber-500/25 bg-amber-500/10 text-amber-900"
      )}
    >
      {children}
    </div>
  );
}

export function WidgetFooter({ text }: { text: string }) {
  return (
    <p className="mt-2.5 text-center text-[10px] leading-relaxed text-muted-foreground/60">
      {text}
    </p>
  );
}

export function WidgetTypingIndicator({
  theme,
  label,
}: {
  theme: WidgetTheme;
  label?: string;
}) {
  return (
    <div className="widget-message-in flex items-end gap-2.5 px-1">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-2 ring-background"
        style={{ background: theme.headerGradient }}
      >
        <span className="text-[10px] font-bold">AI</span>
      </div>
      <div className="rounded-[18px] rounded-es-[6px] border border-border/40 bg-background px-3.5 py-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="widget-typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
              style={{ animationDelay: `${i * 0.14}s` }}
            />
          ))}
        </div>
        {label ? (
          <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
        ) : null}
      </div>
    </div>
  );
}
