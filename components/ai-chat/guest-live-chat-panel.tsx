"use client";

import { useEffect, useRef, useState } from "react";
import { Headset, Loader2, MessageCircle } from "lucide-react";
import type { Value } from "react-phone-number-input";

import { InternationalPhoneField } from "@/components/shared/international-phone-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateInternationalPhone } from "@/lib/phone/international-phone";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/realtime";
import {
  WidgetEmptyState,
  WidgetInlineNotice,
  formatWidgetTime,
} from "@/components/ai-chat/widget-primitives";
import { EndLiveChatButton } from "@/components/ai-chat/end-live-chat-button";

interface GuestLiveChatPanelProps {
  messages: Message[];
  guestName?: string;
  guestPhone?: string;
  loading?: boolean;
  error?: string | null;
  primaryColor: string;
  headerGradient?: string;
  expanded?: boolean;
  onSend: (content: string) => Promise<boolean>;
  onUpdateProfile: (fields: {
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
  }) => void | Promise<void>;
  onStartLiveChat?: (fields: {
    guestName?: string;
    guestEmail?: string;
    guestPhone: string;
  }) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  onEndLiveChat?: () => Promise<{ success: boolean; error?: string }>;
}

function WaitingForAgentState() {
  return (
    <WidgetEmptyState
      tone="waiting"
      icon={<Headset className="h-5 w-5" />}
      title="بانتظار موظف الدعم"
      description="تم استلام رسالتك. سيرد عليك أحد موظفينا في أقرب وقت."
    />
  );
}

function GuestLiveChatOnboarding({
  primaryColor,
  loading,
  onComplete,
}: {
  primaryColor: string;
  loading?: boolean;
  onComplete: (fields: {
    guestPhone: string;
    guestName?: string;
    guestEmail?: string;
  }) => Promise<void>;
}) {
  const [phone, setPhone] = useState<Value>();
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const phoneResult = validateInternationalPhone(phone || "");
    if (!phoneResult.ok) {
      setPhoneError(phoneResult.error);
      return;
    }

    setSubmitting(true);
    try {
      await onComplete({
        guestPhone: phoneResult.normalized,
        guestName: name.trim() || undefined,
        guestEmail: email.trim() || undefined,
      });
    } catch {
      setError("تعذّر حفظ البيانات. حاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="widget-panel-in flex min-h-0 flex-1 flex-col justify-center px-4 py-6">
      <div className="mx-auto w-full max-w-sm space-y-4">
        <div className="space-y-1.5 text-center">
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[16px] text-white shadow-[0_6px_20px_-8px_rgba(15,23,42,0.35)]"
            style={{ backgroundColor: primaryColor }}
          >
            <MessageCircle className="h-5 w-5" />
          </div>
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
            قبل بدء المحادثة
          </h3>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            رقم الهاتف مطلوب فقط — باقي الحقول اختيارية.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-[18px] border border-border/45 bg-background p-4 shadow-[0_2px_12px_-6px_rgba(15,23,42,0.08)]"
        >
          <InternationalPhoneField
            value={phone}
            onChange={setPhone}
            error={phoneError}
            onErrorChange={setPhoneError}
            disabled={submitting || loading}
          />

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              الاسم <span className="text-muted-foreground">(اختياري)</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-xl text-sm"
              disabled={submitting || loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              البريد <span className="text-muted-foreground">(اختياري)</span>
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-xl text-sm"
              dir="ltr"
              disabled={submitting || loading}
            />
          </div>

          {error && <WidgetInlineNotice tone="error">{error}</WidgetInlineNotice>}

          <Button
            type="submit"
            className="h-11 w-full rounded-[14px] text-sm font-semibold shadow-sm"
            style={{ backgroundColor: primaryColor }}
            disabled={submitting || loading}
          >
            {submitting || loading ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : null}
            متابعة المحادثة
          </Button>
        </form>
      </div>
    </div>
  );
}

function LiveChatMessageBubble({
  message,
  primaryColor,
  headerGradient,
}: {
  message: Message;
  primaryColor: string;
  headerGradient?: string;
}) {
  const isGuest = message.sender_id.startsWith("guest:");
  const timeLabel = formatWidgetTime(message.created_at);

  return (
    <div
      className={cn(
        "widget-message-in group/msg flex px-1",
        isGuest ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex max-w-[86%] flex-col gap-1",
          isGuest ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-[18px] px-3.5 py-2.5 text-[13px] leading-[1.55] shadow-[0_1px_3px_rgba(15,23,42,0.05)]",
            isGuest
              ? "rounded-ee-[6px] text-white"
              : "rounded-es-[6px] border border-border/40 bg-background text-foreground"
          )}
          style={isGuest ? { backgroundColor: primaryColor } : undefined}
        >
          {!isGuest && (
            <div className="mb-1.5 flex items-center gap-1.5">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                style={{ background: headerGradient || primaryColor }}
              >
                <Headset className="h-3 w-3" />
              </span>
              <p className="text-[10px] font-semibold text-primary">
                {message.sender_name || "الدعم"}
              </p>
            </div>
          )}
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        {timeLabel ? (
          <span className="px-1 text-[10px] tabular-nums text-muted-foreground/55">
            {timeLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function GuestLiveChatPanel({
  messages,
  guestPhone,
  loading = false,
  error,
  primaryColor,
  headerGradient,
  expanded = false,
  onSend,
  onUpdateProfile,
  onStartLiveChat,
  onTyping,
  onEndLiveChat,
}: GuestLiveChatPanelProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const profileReady = Boolean(guestPhone?.trim());

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, profileReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending || loading || !profileReady) return;

    setSending(true);
    setInput("");
    onTyping?.(false);
    await onSend(content);
    setSending(false);
    inputRef.current?.focus();
  };

  const handleOnboardingComplete = async (fields: {
    guestPhone: string;
    guestName?: string;
    guestEmail?: string;
  }) => {
    if (onStartLiveChat) {
      await onStartLiveChat(fields);
      return;
    }
    await onUpdateProfile(fields);
  };

  const messageList = (
    <>
      {messages.length === 0 && !loading && profileReady && (
        <WaitingForAgentState />
      )}
      {messages.map((message) => (
        <LiveChatMessageBubble
          key={message.id}
          message={message}
          primaryColor={primaryColor}
          headerGradient={headerGradient}
        />
      ))}
      {loading && profileReady && (
        <div className="widget-message-in flex justify-start px-1">
          <div className="flex items-center gap-2 rounded-[18px] rounded-es-[6px] border border-border/40 bg-background px-3.5 py-2.5 shadow-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="text-[12px] text-muted-foreground">
              جاري الاتصال…
            </span>
          </div>
        </div>
      )}
    </>
  );

  const composer = (
    <form
      onSubmit={handleSubmit}
      className="flex flex-row-reverse items-center gap-2 rounded-[18px] border border-border/50 bg-background p-1.5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)]"
    >
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          onTyping?.(e.target.value.trim().length > 0);
        }}
        placeholder="اكتب رسالتك…"
        aria-label="رسالة المحادثة المباشرة"
        dir="rtl"
        className="widget-composer-input h-10 min-w-0 flex-1 border-0 bg-transparent py-2 text-start text-[13px] text-foreground outline-none placeholder:text-muted-foreground/65 focus:ring-0 disabled:opacity-60"
        disabled={loading || sending || !profileReady}
        maxLength={4000}
        autoComplete="off"
      />
      <button
        type="submit"
        aria-label="إرسال"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] text-white shadow-[0_4px_14px_-4px_rgba(15,23,42,0.35)] transition-all duration-200 enabled:hover:brightness-110 enabled:active:scale-[0.96] disabled:opacity-35"
        style={{ backgroundColor: primaryColor }}
        disabled={loading || sending || !input.trim() || !profileReady}
      >
        {sending ? (
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

  if (expanded) {
    if (!profileReady) {
      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <GuestLiveChatOnboarding
            primaryColor={primaryColor}
            loading={loading}
            onComplete={handleOnboardingComplete}
          />
          {error && (
            <div className="px-4 pb-3">
              <WidgetInlineNotice tone="error">{error}</WidgetInlineNotice>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3"
        >
          {messageList}
        </div>

        <div className="shrink-0 border-t border-border/35 bg-background/95 px-3 py-2.5 pb-10 backdrop-blur-sm">
          {error && (
            <div className="mb-2">
              <WidgetInlineNotice tone="error">{error}</WidgetInlineNotice>
            </div>
          )}
          {onEndLiveChat ? (
            <div className="mb-2">
              <EndLiveChatButton onConfirm={onEndLiveChat} variant="panel" />
            </div>
          ) : null}
          {composer}
        </div>
      </div>
    );
  }

  return (
    <div className="widget-panel-in space-y-3 rounded-[18px] border border-border/45 bg-background p-3 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-white shadow-sm"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-foreground">
            محادثة مباشرة مع الدعم
          </p>
          <p className="text-[11px] text-muted-foreground">
            سيرد عليك أحد موظفينا قريبًا
          </p>
        </div>
      </div>

      {!profileReady ? (
        <GuestLiveChatOnboarding
          primaryColor={primaryColor}
          loading={loading}
          onComplete={handleOnboardingComplete}
        />
      ) : (
        <>
          <div
            ref={scrollRef}
            className="max-h-48 space-y-2 overflow-y-auto rounded-[14px] bg-muted/20 p-2 ring-1 ring-border/25"
          >
            {messageList}
          </div>
          {error && <WidgetInlineNotice tone="error">{error}</WidgetInlineNotice>}
          {composer}
        </>
      )}
    </div>
  );
}
