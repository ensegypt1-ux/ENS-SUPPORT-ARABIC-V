"use client";

import { Headset, MessageSquare, Ticket } from "lucide-react";
import { WidgetActionCard } from "@/components/ai-chat/widget-primitives";

type WidgetWelcomeProps = {
  primaryColor: string;
  accentColor?: string;
  supportOnline: boolean | null;
  liveChatEnabled: boolean;
  onFocusAi: () => void;
  onLiveChat: () => void;
  onTicket: () => void;
};

export function WidgetWelcomeActions({
  primaryColor,
  accentColor,
  supportOnline,
  liveChatEnabled,
  onFocusAi,
  onLiveChat,
  onTicket,
}: WidgetWelcomeProps) {
  const accent = accentColor || primaryColor;

  return (
    <div className="widget-welcome-actions widget-panel-in space-y-2 px-1 pb-1 pt-3">
      <p className="px-1 text-[11px] font-medium text-muted-foreground">
        كيف نساعدك اليوم؟
      </p>
      <div className="grid gap-2">
        <WidgetActionCard
          icon={<MessageSquare className="h-4 w-4" />}
          title="اسأل المساعد الذكي"
          description="مساعد ذكي مدعوم بالذكاء الاصطناعي"
          onClick={onFocusAi}
          accent={primaryColor}
        />
        {liveChatEnabled && (
          <WidgetActionCard
            icon={<Headset className="h-4 w-4" />}
            title="الدعم المباشر"
            description={
              supportOnline === false
                ? "غير متصل حاليًا — يمكنك إرسال طلب بدلاً من ذلك"
                : "تحدث مباشرة مع أحد موظفينا"
            }
            onClick={onLiveChat}
            disabled={supportOnline === false}
            accent={accent}
          />
        )}
        <WidgetActionCard
          icon={<Ticket className="h-4 w-4" />}
          title="إرسال طلب دعم"
          description="للمشاكل التي تحتاج متابعة من الفريق"
          onClick={onTicket}
          accent={primaryColor}
        />
      </div>
    </div>
  );
}
