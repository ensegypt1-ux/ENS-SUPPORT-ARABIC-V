"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowUp, Headset, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveWidgetTheme } from "@/lib/ai/widget-theme";
import type { AIChatbotPublicConfig } from "@/types";
import { useChatSession, type ChatMessage } from "./use-chat-session";
import { ChatMessageBubble } from "./chat-message";
import { GuestTicketForm } from "./guest-ticket-form";
import { StableGuestLiveChatPanel } from "./stable-guest-live-chat-panel";
import {
  SupportOnlineProvider,
  useSupportOnline,
} from "./support-online-context";
import { useGuestLiveChat } from "./use-guest-live-chat";

const COMPOSER_TEXTAREA_MIN_HEIGHT = 24;
const COMPOSER_TEXTAREA_MAX_HEIGHT = 112;

interface ChatWindowProps {
  config: AIChatbotPublicConfig;
  onClose: () => void;
  /** Accepted for caller compatibility (embed iframe); no longer renders links. */
  embedded?: boolean;
  /** Use the saved Widget tab dimensions outside the embed iframe. */
  sizeMode?: "fixed" | "configured";
  appOrigin?: string;
  /**
   * Scopes the persisted chat session. In the embed iframe this is the host
   * site's origin so each site keeps its own conversation; omit it elsewhere.
   */
  storageNamespace?: string;
  /** Embed snippet key → scopes the bot's answers to one site (+ global). */
  siteKey?: string;
  /** Host origin the widget is embedded on (for optional domain validation). */
  host?: string;
}

function ChatHeaderSubtitle({
  isLiveChat,
  isConnected,
}: {
  isLiveChat: boolean;
  isConnected: boolean;
}) {
  const supportOnline = useSupportOnline();

  if (isLiveChat) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/90">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            isConnected
              ? "bg-emerald-400 shadow-[0_0_0_2px_rgba(255,255,255,0.25)]"
              : "bg-amber-300 animate-pulse"
          )}
        />
        {isConnected ? "متصل بفريق الدعم" : "جاري الاتصال…"}
      </span>
    );
  }

  if (supportOnline === null) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/90">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          supportOnline ? "bg-emerald-400" : "bg-white/45"
        )}
      />
      {supportOnline
        ? "الدعم متاح — محادثة مباشرة"
        : "الدعم غير متاح — أرسل تذكرة"}
    </span>
  );
}

function ThinkingIndicator({ headerGradient }: { headerGradient: string }) {
  return (
    <div className="widget-message-in flex items-end gap-2">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-2 ring-background"
        style={{ background: headerGradient }}
      >
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="rounded-2xl rounded-es-md border border-border/45 bg-background px-3.5 py-2.5 shadow-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="widget-typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/55"
              style={{ animationDelay: `${i * 0.14}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveChatHandoffButton({
  hasLiveChatSession,
  pendingLiveChat,
  showTicketForm,
  hydrated,
  lastUserMessage,
  onHandoff,
}: {
  hasLiveChatSession: boolean;
  pendingLiveChat: boolean;
  showTicketForm: boolean;
  hydrated: boolean;
  lastUserMessage: string;
  onHandoff: (options: { lastMessage?: string }) => void;
}) {
  const supportOnline = useSupportOnline();
  if (
    !supportOnline ||
    hasLiveChatSession ||
    pendingLiveChat ||
    showTicketForm ||
    !hydrated
  ) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => onHandoff({ lastMessage: lastUserMessage })}
      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 px-3 py-2.5 text-[12px] font-semibold text-primary ring-1 ring-primary/20 transition-all hover:bg-primary/15 hover:ring-primary/30 active:scale-[0.98]"
    >
      <Headset className="h-4 w-4 transition-transform group-hover:scale-105" />
      التحدث مع موظف الدعم الآن
    </button>
  );
}

export function ChatWindow({
  config,
  onClose,
  embedded,
  sizeMode = "fixed",
  storageNamespace,
  siteKey,
  host,
}: ChatWindowProps) {
  const session = useChatSession(storageNamespace);
  const {
    hydrated,
    visitorId,
    sessionId,
    messages,
    addMessage,
    updateMessage,
    getRecentHistory,
  } = session;

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [lastLogId, setLastLogId] = useState<string | undefined>();
  const [lastUserMessage, setLastUserMessage] = useState("");
  const [handoffDepartment, setHandoffDepartment] = useState<
    string | undefined
  >();

  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const guestLiveChat = useGuestLiveChat({
    guestSessionId: visitorId,
    storageNamespace,
    guestLiveChatEnabled: config.guestLiveChatEnabled,
  });

  const hasLiveChatSession = Boolean(guestLiveChat.session?.guestPhone?.trim());
  const showLiveChatPanel =
    hasLiveChatSession || Boolean(guestLiveChat.pendingLiveChat);

  const theme = resolveWidgetTheme(config.primaryColor, config.accentColor);
  const headerTitle =
    config.headerTitle?.trim() || config.businessName?.trim() || "المحادثة المباشرة";
  const configuredSizeStyle: CSSProperties | undefined =
    !embedded && sizeMode === "configured"
      ? {
          width: config.widgetWidth,
          height: config.widgetHeight,
        }
      : undefined;

  useEffect(() => {
    if (hydrated && messages.length === 0) {
      addMessage({
        role: "assistant",
        content: config.welcomeMessage,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, showTicketForm, showLiveChatPanel, guestLiveChat.messages]);

  const handleHumanHandoff = async (options: {
    chatLogId?: string;
    departmentSlug?: string;
    lastMessage?: string;
  }) => {
    setHandoffDepartment(options.departmentSlug);
    setLastUserMessage(options.lastMessage || lastUserMessage);

    if (hasLiveChatSession || guestLiveChat.pendingLiveChat) {
      return;
    }

    if (config.guestLiveChatEnabled) {
      const result = await guestLiveChat.requestLiveChat({
        chatLogId: options.chatLogId,
        departmentSlug: options.departmentSlug,
      });

      if (result.success) {
        setShowTicketForm(false);
        addMessage({
          role: "system",
          content: "تم فتح محادثة مباشرة مع فريق الدعم. اكتب رسالتك أدناه.",
        });
        return;
      }

      if (result.offline) {
        setShowTicketForm(true);
        addMessage({
          role: "system",
          content:
            "فريق الدعم غير متاح حاليًا. يمكنك إرسال طلب وسنتواصل معك عبر WhatsApp.",
        });
        return;
      }
    }

    setShowTicketForm(true);
  };

  const resizeComposer = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${
      input.trim()
        ? Math.min(textarea.scrollHeight, COMPOSER_TEXTAREA_MAX_HEIGHT)
        : COMPOSER_TEXTAREA_MIN_HEIGHT
    }px`;
  }, [input]);

  useEffect(() => {
    resizeComposer();
  }, [resizeComposer]);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;

    let frame = 0;
    const scheduleResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(resizeComposer);
    };

    scheduleResize();
    window.addEventListener("resize", scheduleResize);

    if (typeof ResizeObserver === "undefined") {
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", scheduleResize);
      };
    }

    const observer = new ResizeObserver(scheduleResize);
    observer.observe(composer);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", scheduleResize);
    };
  }, [resizeComposer]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question || isLoading || !hydrated) return;

    setInput("");
    setError(null);
    setShowTicketForm(false);
    setLastUserMessage(question);

    // Capture prior turns before appending the new user message.
    const history = getRecentHistory(6);

    addMessage({ role: "user", content: question });
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          visitorId,
          sessionId,
          history,
          siteKey: siteKey || undefined,
          host: host || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "حدث خطأ ما");
        addMessage({
          role: "system",
          content: data.error ?? "حدث خطأ ما",
        });
        return;
      }

      const payload = data.data as {
        matched: boolean;
        answer: string;
        outcome: string;
        escalated: boolean;
        suggestedDepartmentSlug?: string;
        sources?: { title: string; url: string }[];
        logId: string;
      };
      setLastLogId(payload.logId);

      addMessage({
        role: "assistant",
        content: payload.answer,
        matched: payload.matched,
        isFallback: payload.escalated,
        logId: payload.logId,
        sources: payload.sources,
      });

      // The customer agreed to talk to a human → open the ticket form,
      // pre-routed to the department the agent inferred from the chat.
      if (payload.escalated) {
        await handleHumanHandoff({
          chatLogId: payload.logId,
          departmentSlug: payload.suggestedDepartmentSlug,
          lastMessage: question,
        });
      }
    } catch {
      setError("خطأ في الشبكة");
      addMessage({ role: "system", content: "خطأ في الشبكة —  المحاولة مرة أخرى." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTicketSubmitted = (ticketNumber: string) => {
    setShowTicketForm(false);
    addMessage({
      role: "system",
      content: `شكرًا! تم إنشاء التذكرة ${ticketNumber} — سنرد عليك عبر البريد الإلكتروني قريبًا.`,
    });
  };

  const handleFeedback = async (
    message: ChatMessage,
    feedback: "up" | "down"
  ) => {
    if (!message.logId || !hydrated) return;
    updateMessage(message.id, { feedback });
    try {
      const res = await fetch("/api/ai/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logId: message.logId,
          visitorId,
          sessionId,
          feedback,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        updateMessage(message.id, { feedback: message.feedback });
      }
    } catch {
      updateMessage(message.id, { feedback: message.feedback });
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <SupportOnlineProvider enabled={config.guestLiveChatEnabled}>
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-background shadow-[0_12px_48px_-16px_rgba(15,23,42,0.35)] ring-1 ring-black/[0.04]",
        embedded
          ? "h-full max-h-full w-full"
          : sizeMode === "configured"
            ? "max-w-full"
            : "h-[36rem] max-h-[calc(100vh-6rem)] w-[24rem]"
      )}
      style={configuredSizeStyle}
    >
      <header
        className="relative shrink-0 overflow-hidden px-4 py-3 text-white"
        style={{ background: theme.headerGradient }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.14),transparent_55%)]" />
        <div className="relative flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/25 shadow-md">
            {config.headerAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.headerAvatarUrl}
                alt={headerTitle}
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
            {hasLiveChatSession && (
              <span
                className={cn(
                  "absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full border-2 border-white/90",
                  guestLiveChat.isConnected ? "bg-emerald-400" : "bg-amber-300"
                )}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[14px] font-semibold leading-tight">
              {hasLiveChatSession ? "محادثة مباشرة" : headerTitle}
            </h2>
            {(config.guestLiveChatEnabled || hasLiveChatSession) && (
              <div className="mt-0.5">
                <ChatHeaderSubtitle
                  isLiveChat={hasLiveChatSession}
                  isConnected={guestLiveChat.isConnected}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            title="إغلاق"
            aria-label="إغلاق المحادثة"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden",
          !hasLiveChatSession && "bg-muted/20"
        )}
      >
        <div
          ref={scrollRef}
          className={cn(
            "min-h-0 flex-1 overflow-y-auto",
            hasLiveChatSession
              ? "flex flex-col"
              : "space-y-2.5 px-3 py-3"
          )}
        >
        {!hasLiveChatSession &&
          messages.map((m: ChatMessage) => (
            <ChatMessageBubble
              key={m.id}
              message={m}
              primaryColor={config.primaryColor}
              accentColor={config.accentColor}
              onFeedback={handleFeedback}
            />
          ))}
        {!hasLiveChatSession && isLoading && (
          <ThinkingIndicator headerGradient={theme.headerGradient} />
        )}
        {showLiveChatPanel && (
          <StableGuestLiveChatPanel
            session={guestLiveChat.session}
            messages={guestLiveChat.messages}
            bootstrapping={guestLiveChat.bootstrapping}
            error={guestLiveChat.error}
            primaryColor={theme.primary}
            headerGradient={theme.headerGradient}
            onSend={guestLiveChat.sendMessage}
            onUpdateProfile={guestLiveChat.updateProfile}
            onStartLiveChat={async (fields) => {
              const result = await guestLiveChat.startLiveChat(fields);
              if (!result.success) {
                throw new Error(guestLiveChat.error || "تعذّر بدء المحادثة");
              }
            }}
            onTyping={guestLiveChat.setTyping}
          />
        )}
        {!hasLiveChatSession && showTicketForm && hydrated && (
          <GuestTicketForm
            visitorId={visitorId}
            chatLogId={lastLogId}
            defaultMessage={lastUserMessage}
            departmentSlug={handoffDepartment}
            onSubmitted={handleTicketSubmitted}
            onCancel={() => setShowTicketForm(false)}
          />
        )}
        <LiveChatHandoffButton
          hasLiveChatSession={hasLiveChatSession}
          pendingLiveChat={Boolean(guestLiveChat.pendingLiveChat)}
          showTicketForm={showTicketForm}
          hydrated={hydrated}
          lastUserMessage={lastUserMessage}
          onHandoff={handleHumanHandoff}
        />
        </div>

        {error && (
          <p className="shrink-0 border-t border-destructive/20 bg-destructive/5 px-3 py-1.5 text-[11px] text-destructive">
            {error}
          </p>
        )}

        {!hasLiveChatSession && (
          <div className="shrink-0 border-t border-border/40 bg-background/95 px-3 pb-3 pt-2 backdrop-blur-md">
            <form
              ref={composerRef}
              onSubmit={handleSend}
              className="flex items-end gap-2 rounded-2xl border border-border/55 bg-background p-1.5 shadow-sm transition-[border-color,box-shadow] focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/10"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={config.placeholder}
                aria-label="رسالة المحادثة"
                className="block max-h-28 min-h-6 flex-1 resize-none overflow-y-auto bg-transparent px-2 py-1.5 text-[13px] leading-relaxed text-foreground caret-foreground outline-none placeholder:text-muted-foreground/75"
                disabled={isLoading || !hydrated}
                maxLength={500}
                autoComplete="off"
                rows={1}
              />
              <button
                type="submit"
                aria-label="إرسال الرسالة"
                title="إرسال الرسالة"
                className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-all enabled:hover:brightness-110 enabled:active:scale-95 disabled:opacity-35"
                style={{ backgroundColor: theme.sendButton }}
                disabled={isLoading || !input.trim() || !hydrated}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </button>
            </form>

            {config.showPoweredBy && config.footerText?.trim() && (
              <p className="mt-2 text-center text-[10px] text-muted-foreground/65">
                {config.footerText}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
    </SupportOnlineProvider>
  );
}
