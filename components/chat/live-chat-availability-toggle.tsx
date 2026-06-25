"use client";

import { useEffect, useState } from "react";
import { Headset } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useLiveChatAvailability } from "@/hooks/useLiveChatAvailability";

type LiveChatAvailabilityToggleProps = {
  userId: string;
  role: string;
  className?: string;
};

export function LiveChatAvailabilityToggle({
  userId,
  role,
  className,
}: LiveChatAvailabilityToggleProps) {
  const [mounted, setMounted] = useState(false);
  const enabled = role === "admin" || role === "support";
  const { isAvailable, loading, updating, toggle, error } =
    useLiveChatAvailability({ userId, enabled });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!enabled) return null;

  const hint =
    "تسجيل الدخول لا يعني أنك متاح للعملاء. فعّل هذا الخيار فقط عند استعدادك لاستقبال محادثات الزوار.";

  const switchDisabled = !mounted || loading || updating;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-2.5 py-1 transition-colors",
        isAvailable
          ? "border-success/30 bg-success/10"
          : "border-border/70 bg-muted/30",
        className
      )}
      title={error ? `${hint} (${error})` : hint}
    >
      <Headset
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          isAvailable ? "text-success" : "text-muted-foreground"
        )}
        aria-hidden
      />
      <span className="hidden text-xs font-medium sm:inline">
        {mounted && isAvailable ? "متاح للمحادثة" : "غير متاح"}
      </span>
      <Switch
        checked={mounted ? isAvailable : false}
        onCheckedChange={() => void toggle()}
        disabled={switchDisabled}
        aria-label={
          isAvailable
            ? "إيقاف استقبال المحادثات المباشرة"
            : "تفعيل استقبال المحادثات المباشرة"
        }
        className="scale-90"
      />
    </div>
  );
}
