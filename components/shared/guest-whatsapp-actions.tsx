"use client";

import { ExternalLink, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  buildWhatsAppUrl,
  formatPhoneDisplay,
  normalizeToE164,
} from "@/lib/phone/international-phone";
import { cn } from "@/lib/utils";

interface GuestWhatsAppActionsProps {
  phone?: string | null;
  guestName?: string | null;
  message?: string;
  compact?: boolean;
  className?: string;
}

export function GuestWhatsAppActions({
  phone,
  guestName,
  message,
  compact = false,
  className,
}: GuestWhatsAppActionsProps) {
  if (!phone?.trim()) return null;

  const normalized = normalizeToE164(phone);
  const display = normalized ? formatPhoneDisplay(normalized) : phone.trim();
  const waUrl = buildWhatsAppUrl(
    phone,
    message ||
      (guestName
        ? `مرحبًا ${guestName}، معك فريق الدعم.`
        : "مرحبًا، معك فريق الدعم.")
  );

  if (!waUrl) return null;

  if (compact) {
    return (
      <Button
        asChild
        size="icon"
        variant="ghost"
        className={cn(
          "h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40",
          className
        )}
        title={`WhatsApp — ${display}`}
      >
        <a href={waUrl} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-4 w-4" />
          <span className="sr-only">فتح WhatsApp</span>
        </a>
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border/60 bg-muted/25 px-2.5 py-1.5",
        className
      )}
    >
      <MessageCircle className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <p
        className="min-w-0 flex-1 truncate text-xs font-medium text-foreground"
        dir="ltr"
      >
        {display}
      </p>
      <Button
        asChild
        size="sm"
        variant="ghost"
        className="h-7 shrink-0 gap-1 rounded-md px-2 text-[11px] text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
      >
        <a href={waUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-3 w-3" />
          WhatsApp
        </a>
      </Button>
    </div>
  );
}
