"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AIChatbotPublicConfig } from "@/types";
import { ChatWindow } from "@/components/ai-chat/chat-window";
import { AI_CHAT_OPEN_EVENT } from "@/lib/ai/open-ai-chat";
import { useAiChatConfig } from "@/components/ai-chat/use-ai-chat-config";
import {
  WidgetLauncherButton,
  widgetLauncherPositionClass,
} from "@/components/ai-chat/widget-launcher-button";

interface FloatingChatButtonProps {
  className?: string;
}

const HIDDEN_PATH_PREFIXES = [
  "/admin",
  "/dashboard",
  "/support-agent",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api",
  "/embed",
];

function isHiddenPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return HIDDEN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Floating launcher for the AI support agent chat. WhatsApp moved to the
 * public header, so this corner belongs to the AI assistant alone.
 */
export function FloatingChatButton({ className }: FloatingChatButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const aiConfig = useAiChatConfig();
  const [showAiChat, setShowAiChat] = useState(false);
  const pathname = usePathname();

  // Delay visibility for smooth entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Allow other components (e.g. the docs "Ask AI" button) to open AI chat.
  useEffect(() => {
    const handler = () => {
      if (aiConfig?.enabled) {
        setShowAiChat(true);
      }
    };
    window.addEventListener(AI_CHAT_OPEN_EVENT, handler);
    return () => window.removeEventListener(AI_CHAT_OPEN_EVENT, handler);
  }, [aiConfig?.enabled]);

  const showAi = aiConfig?.enabled === true;

  if (isHiddenPath(pathname) || !showAi || !aiConfig) return null;

  const position = aiConfig.position ?? "bottom-right";

  return (
    <div
      className={cn(
        "fixed bottom-6 z-50 flex flex-col gap-3 transition-all duration-500",
        widgetLauncherPositionClass(position),
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
        className
      )}
    >
      {/* AI Chat Window — keep mounted so guest live chat session survives close/reopen */}
      <div
        className={cn(
          "transition-all duration-300",
          showAiChat
            ? "opacity-100 translate-y-0"
            : "pointer-events-none fixed -bottom-[9999px] opacity-0"
        )}
        aria-hidden={!showAiChat}
      >
        <ChatWindow config={aiConfig} onClose={() => setShowAiChat(false)} />
      </div>

      {/* Launcher (hidden while AI window is open — it has its own close) */}
      {!showAiChat && (
        <WidgetLauncherButton
          headerAvatarUrl={aiConfig.headerAvatarUrl}
          primaryColor={aiConfig.primaryColor}
          onClick={() => setShowAiChat(true)}
          variant="site"
        />
      )}
    </div>
  );
}
