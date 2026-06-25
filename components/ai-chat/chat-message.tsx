"use client";

import ReactMarkdown from "react-markdown";
import { Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveWidgetTheme } from "@/lib/ai/widget-theme";
import type { ChatMessage } from "./use-chat-session";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  primaryColor?: string;
  accentColor?: string;
  onFeedback?: (message: ChatMessage, feedback: "up" | "down") => void;
}

export function ChatMessageBubble({
  message,
  primaryColor,
  accentColor,
  onFeedback,
}: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const theme = resolveWidgetTheme(primaryColor, accentColor);

  if (isSystem) {
    return (
      <div className="widget-message-in flex justify-center py-1">
        <p className="max-w-[92%] rounded-full border border-border/40 bg-muted/50 px-3 py-1 text-center text-[11px] leading-relaxed text-muted-foreground">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "widget-message-in flex items-end gap-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div
          className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-2 ring-background"
          style={{ background: theme.headerGradient }}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      )}
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-1.5 rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed break-words shadow-sm",
          isUser
            ? "rounded-ee-md text-white"
            : "rounded-es-md border border-border/45 bg-background text-foreground"
        )}
        style={isUser ? { backgroundColor: theme.primary } : undefined}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <div
            className={cn(
              "space-y-2 [&_p]:m-0",
              "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:ps-4",
              "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:ps-4",
              "[&_li]:my-0.5 [&_strong]:font-semibold",
              "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]"
            )}
          >
            <ReactMarkdown
              components={{
                a: (props) => (
                  <a
                    href={props.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-2 break-words"
                    style={{ color: theme.primary }}
                  >
                    {props.children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-0.5 flex flex-col gap-0.5 border-t border-border/40 pt-1.5">
            <span className="text-[10px] font-medium text-muted-foreground/80">
              المصادر
            </span>
            {message.sources.map((s, i) => (
              <a
                key={`${s.url}-${i}`}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-[11px] underline decoration-dotted underline-offset-2 hover:decoration-solid"
                style={{ color: theme.primary }}
                title={s.url}
              >
                {s.title}
              </a>
            ))}
          </div>
        )}
        {!isUser && message.logId && onFeedback && (
          <div className="mt-0.5 flex items-center gap-1 border-t border-border/40 pt-1.5">
            {(["up", "down"] as const).map((value) => {
              const active = message.feedback === value;
              const Icon = value === "up" ? ThumbsUp : ThumbsDown;
              return (
                <button
                  key={value}
                  type="button"
                  title={
                    value === "up" ? "الإجابة مفيدة" : "الإجابة غير مفيدة"
                  }
                  aria-label={
                    value === "up" ? "الإجابة مفيدة" : "الإجابة غير مفيدة"
                  }
                  onClick={() => onFeedback(message, value)}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border transition-all",
                    active
                      ? "border-transparent text-white shadow-sm"
                      : "border-border/50 text-muted-foreground hover:bg-muted/60"
                  )}
                  style={active ? { backgroundColor: theme.primary } : undefined}
                >
                  <Icon className="h-3 w-3" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
