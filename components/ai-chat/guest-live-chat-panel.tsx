"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Headset, Loader2, MessageCircle } from "lucide-react";
import type { Value } from "react-phone-number-input";

import { InternationalPhoneField } from "@/components/shared/international-phone-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateInternationalPhone } from "@/lib/phone/international-phone";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/realtime";

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
}

function LiveChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15">
        <Headset className="h-5 w-5" />
      </div>
      <p className="text-[13px] font-semibold text-foreground">أنت متصل بفريق الدعم</p>
      <p className="mt-1 max-w-[220px] text-[12px] leading-relaxed text-muted-foreground">
        اكتب رسالتك أدناه وسيرد عليك أحد موظفينا في أقرب وقت.
      </p>
    </div>
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
    <div className="flex min-h-0 flex-1 flex-col justify-center px-4 py-5">
      <div className="mx-auto w-full max-w-sm space-y-4">
        <div className="space-y-1 text-center">
          <div
            className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            <MessageCircle className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            قبل بدء المحادثة
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            رقم الهاتف فقط مطلوب — باقي الحقول اختيارية.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border/50 bg-background p-4 shadow-sm">
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
              className="h-9 text-sm"
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
              className="h-9 text-sm"
              dir="ltr"
              disabled={submitting || loading}
            />
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            className="h-10 w-full rounded-xl text-sm"
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

export function GuestLiveChatPanel({
  messages,
  guestName,
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
      {messages.length === 0 && !loading && profileReady && <LiveChatEmptyState />}
      {messages.map((message) => {
        const isGuest = message.sender_id.startsWith("guest:");
        return (
          <div
            key={message.id}
            className={cn(
              "widget-message-in flex",
              isGuest ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[88%] shadow-sm",
                isGuest
                  ? "rounded-2xl rounded-ee-md px-3.5 py-2 text-[13px] leading-relaxed text-white"
                  : "rounded-2xl rounded-es-md border border-border/50 bg-background px-3.5 py-2 text-[13px] leading-relaxed text-foreground"
              )}
              style={isGuest ? { backgroundColor: primaryColor } : undefined}
            >
              {!isGuest && (
                <div className="mb-1 flex items-center gap-1.5">
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{
                      background: headerGradient || primaryColor,
                    }}
                  >
                    <Headset className="h-2.5 w-2.5" />
                  </span>
                  <p className="text-[10px] font-semibold text-primary">
                    {message.sender_name || "الدعم"}
                  </p>
                </div>
              )}
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          </div>
        );
      })}
      {loading && profileReady && (
        <div className="widget-message-in flex justify-start">
          <div className="flex items-center gap-2 rounded-2xl rounded-es-md border border-border/50 bg-background px-3.5 py-2 shadow-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="text-[12px] text-muted-foreground">جاري الاتصال…</span>
          </div>
        </div>
      )}
    </>
  );

  const composer = (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            onTyping?.(e.target.value.trim().length > 0);
          }}
          placeholder="اكتب رسالتك…"
          aria-label="رسالة المحادثة المباشرة"
          className="h-10 w-full rounded-xl border border-border/60 bg-background px-3.5 text-[13px] text-foreground shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus:border-primary/35 focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
          disabled={loading || sending || !profileReady}
          maxLength={4000}
          autoComplete="off"
        />
      </div>
      <button
        type="submit"
        aria-label="إرسال"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-all enabled:hover:brightness-110 enabled:active:scale-95 disabled:opacity-35"
        style={{ backgroundColor: primaryColor }}
        disabled={loading || sending || !input.trim() || !profileReady}
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowUp className="h-4 w-4" />
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
            <p className="px-4 pb-3 text-center text-[11px] text-destructive">
              {error}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-3"
        >
          {messageList}
        </div>

        <div className="shrink-0 border-t border-border/40 bg-background/95 px-3 py-2.5 backdrop-blur-md">
          {error && (
            <p className="mb-2 rounded-lg bg-destructive/10 px-2.5 py-1.5 text-[11px] text-destructive">
              {error}
            </p>
          )}
          {composer}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
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
            className="max-h-48 space-y-2 overflow-y-auto rounded-xl bg-muted/25 p-2 ring-1 ring-border/30"
          >
            {messageList}
          </div>
          {error && (
            <p className="rounded-lg bg-destructive/10 px-2.5 py-1.5 text-[11px] text-destructive">
              {error}
            </p>
          )}
          {composer}
        </>
      )}
    </div>
  );
}
