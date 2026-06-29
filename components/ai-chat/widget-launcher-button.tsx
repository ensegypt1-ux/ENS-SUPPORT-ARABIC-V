"use client";

import { MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DEFAULT_WIDGET_PRIMARY,
  resolveWidgetTheme,
} from "@/lib/ai/widget-theme";

export interface WidgetLauncherButtonProps {
  headerAvatarUrl?: string;
  primaryColor?: string;
  onClick: () => void;
  className?: string;
  /** Site bubble (portal) vs embed iframe styling */
  variant?: "site" | "embed";
  showOnlineIndicator?: boolean;
  ariaLabel?: string;
  title?: string;
}

export function WidgetLauncherButton({
  headerAvatarUrl,
  primaryColor,
  onClick,
  className,
  variant = "site",
  showOnlineIndicator = true,
  ariaLabel = "المحادثة مع المساعد الذكي",
  title = "المحادثة مع المساعد الذكي",
}: WidgetLauncherButtonProps) {
  const avatarUrl = headerAvatarUrl?.trim();
  const hasAvatar = Boolean(avatarUrl);
  const theme = resolveWidgetTheme(primaryColor, undefined);
  const brandPrimary = theme.primary || DEFAULT_WIDGET_PRIMARY;

  const sizeClass =
    variant === "embed" ? "h-[3.75rem] w-[3.75rem]" : "h-14 w-14";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      className={cn(
        "group relative flex shrink-0 items-center justify-center overflow-hidden rounded-full transition-all duration-300",
        sizeClass,
        hasAvatar
          ? cn(
              "bg-background shadow-lg ring-2 ring-border/60 hover:shadow-xl",
              "hover:scale-105 active:scale-95",
              "dark:ring-border/80 dark:shadow-black/30"
            )
          : cn(
              "text-white shadow-lg hover:shadow-xl",
              "hover:scale-105 active:scale-95",
              "hover:brightness-110",
              variant === "embed" &&
                "shadow-[0_8px_32px_-8px_rgba(37,99,235,0.55)] ring-4 ring-primary/10 hover:scale-[1.04] hover:shadow-[0_12px_40px_-8px_rgba(37,99,235,0.6)] active:scale-[0.98]"
            ),
        className
      )}
      style={!hasAvatar ? { backgroundColor: brandPrimary } : undefined}
    >
      {hasAvatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
        />
      ) : (
        <MessageCircle
          className={cn(
            "h-6 w-6 transition-transform duration-300",
            variant === "embed" && "group-hover:scale-105"
          )}
        />
      )}

      {showOnlineIndicator ? (
        <span className="absolute -end-0.5 -top-0.5 flex h-3.5 w-3.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500" />
        </span>
      ) : null}
    </button>
  );
}

/** RTL-safe fixed corner classes for the public launcher shell. */
export function widgetLauncherPositionClass(
  position: "bottom-left" | "bottom-right" = "bottom-right"
) {
  return position === "bottom-left"
    ? "start-6 items-start"
    : "end-6 items-end";
}
