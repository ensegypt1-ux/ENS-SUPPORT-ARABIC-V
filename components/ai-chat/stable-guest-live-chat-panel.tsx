"use client";

import { memo } from "react";

import { GuestLiveChatPanel } from "@/components/ai-chat/guest-live-chat-panel";
import type { GuestLiveChatSession } from "@/components/ai-chat/use-guest-live-chat";
import type { Message } from "@/types/realtime";

type StableGuestLiveChatPanelProps = {
  session: GuestLiveChatSession | null;
  messages: Message[];
  bootstrapping: boolean;
  error: string | null;
  primaryColor: string;
  headerGradient?: string;
  onSend: (content: string) => Promise<boolean>;
  onUpdateProfile: (fields: {
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
  }) => void | Promise<void>;
  onStartLiveChat: (fields: {
    guestName?: string;
    guestEmail?: string;
    guestPhone: string;
  }) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  onEndLiveChat?: () => Promise<{ success: boolean; error?: string }>;
};

export const StableGuestLiveChatPanel = memo(function StableGuestLiveChatPanel({
  session,
  messages,
  bootstrapping,
  error,
  primaryColor,
  headerGradient,
  onSend,
  onUpdateProfile,
  onStartLiveChat,
  onTyping,
  onEndLiveChat,
}: StableGuestLiveChatPanelProps) {
  return (
    <GuestLiveChatPanel
      expanded
      messages={messages}
      guestName={session?.guestName}
      guestPhone={session?.guestPhone}
      loading={bootstrapping && messages.length === 0}
      error={error}
      primaryColor={primaryColor}
      headerGradient={headerGradient}
      onSend={onSend}
      onUpdateProfile={onUpdateProfile}
      onStartLiveChat={onStartLiveChat}
      onTyping={onTyping}
      onEndLiveChat={onEndLiveChat}
    />
  );
});

StableGuestLiveChatPanel.displayName = "StableGuestLiveChatPanel";
