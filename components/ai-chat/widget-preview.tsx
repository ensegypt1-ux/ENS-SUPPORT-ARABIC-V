"use client";

import { Headset, MessageSquare, Sparkles, Ticket, X } from "lucide-react";
import { resolveWidgetTheme } from "@/lib/ai/widget-theme";
import { WidgetActionCard } from "@/components/ai-chat/widget-primitives";

export interface WidgetPreviewProps {
  headerTitle: string;
  welcomeMessage: string;
  placeholder: string;
  footerText: string;
  showPoweredBy: boolean;
  primaryColor: string;
  accentColor: string;
  headerAvatarUrl: string;
  widgetWidth: number;
  widgetHeight: number;
}

/**
 * Static, non-interactive replica of the live chat widget chrome.
 */
export function WidgetPreview({
  headerTitle,
  welcomeMessage,
  placeholder,
  footerText,
  showPoweredBy,
  primaryColor,
  accentColor,
  headerAvatarUrl,
  widgetWidth,
  widgetHeight,
}: WidgetPreviewProps) {
  const theme = resolveWidgetTheme(primaryColor, accentColor);
  const title = headerTitle.trim() || "المحادثة المباشرة";

  return (
    <div
      className="widget-shell flex shrink-0 flex-col overflow-hidden bg-background"
      style={{ width: widgetWidth, height: widgetHeight }}
    >
      <header
        className="relative shrink-0 overflow-hidden px-4 pb-3.5 pt-3.5 text-white"
        style={{ background: theme.headerGradient }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.16),transparent_52%)]" />
        <div className="relative flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20 shadow-md">
            {headerAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={headerAvatarUrl}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ background: theme.headerGradient }}
              >
                <Sparkles className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-snug">{title}</p>
            <p className="mt-1 text-[11px] text-white/88">الدعم المباشر — متاح الآن</p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12">
            <X className="h-4 w-4" />
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col bg-[linear-gradient(180deg,hsl(var(--muted)/0.35),transparent_120px)]">
        <div className="min-h-0 flex-1 space-y-1 overflow-hidden px-3 py-3">
          <div className="flex items-end gap-2.5 px-1">
            <div
              className="mb-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-2 ring-background"
              style={{ background: theme.headerGradient }}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="max-w-[84%] rounded-[18px] rounded-es-[6px] border border-border/40 bg-background px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground shadow-sm">
              {welcomeMessage || "مرحباً! كيف يمكنني مساعدتك اليوم؟"}
            </div>
          </div>

          <div className="space-y-2 px-1 pt-2">
            <p className="text-[11px] font-medium text-muted-foreground">
              كيف نساعدك اليوم؟
            </p>
            <WidgetActionCard
              icon={<MessageSquare className="h-4 w-4" />}
              title="اسأل المساعد الذكي"
              description="مساعد ذكي مدعوم بالذكاء الاصطناعي"
              accent={theme.primary}
            />
            <WidgetActionCard
              icon={<Headset className="h-4 w-4" />}
              title="الدعم المباشر"
              description="تحدث مباشرة مع أحد موظفينا"
              accent={theme.accent}
            />
            <WidgetActionCard
              icon={<Ticket className="h-4 w-4" />}
              title="إرسال طلب دعم"
              description="للمشاكل التي تحتاج متابعة من الفريق"
              accent={theme.primary}
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-border/35 px-3 pb-3 pt-2.5">
          <div className="flex flex-row-reverse items-end gap-2 rounded-[18px] border border-border/50 bg-background p-1.5 shadow-sm">
            <span className="min-w-0 flex-1 py-2 text-start text-[13px] text-muted-foreground/70">
              {placeholder || "اكتب رسالة..."}
            </span>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] text-white shadow-md"
              style={{ backgroundColor: theme.sendButton }}
            >
              ↑
            </span>
          </div>
          {showPoweredBy && footerText.trim() && (
            <p className="mt-2.5 text-center text-[10px] text-muted-foreground/60">
              {footerText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
