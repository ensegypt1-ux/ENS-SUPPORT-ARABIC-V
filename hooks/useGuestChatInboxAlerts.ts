"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  playGuestInboxSound,
  unlockGuestInboxAudio,
} from "@/lib/chat/guest-inbox-sound";
import { isUnclaimedGuestChat } from "@/lib/chat/guest-queue";
import type { ConversationWithParticipants } from "@/hooks/useRealtimeConversations";

const MUTE_STORAGE_KEY = "ens-inbox-guest-sound-muted";

function readMutedPreference() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_STORAGE_KEY) === "1";
}

function writeMutedPreference(muted: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? "1" : "0");
}

function guestDisplayName(conversation: ConversationWithParticipants) {
  return conversation.guest_name?.trim() || "زائر";
}

export function useGuestChatInboxAlerts(
  conversations: ConversationWithParticipants[],
  loading: boolean
) {
  const [soundMuted, setSoundMuted] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  const baselineReadyRef = useRef(false);
  const knownUnclaimedRef = useRef<Set<string>>(new Set());
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setSoundMuted(readMutedPreference());
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const unlock = () => unlockGuestInboxAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const unclaimed = conversations.filter(isUnclaimedGuestChat);
    const currentIds = new Set(unclaimed.map((c) => c.id));

    if (!baselineReadyRef.current) {
      knownUnclaimedRef.current = currentIds;
      baselineReadyRef.current = true;
      return;
    }

    for (const conversation of unclaimed) {
      if (knownUnclaimedRef.current.has(conversation.id)) continue;
      if (notifiedRef.current.has(conversation.id)) continue;

      notifiedRef.current.add(conversation.id);
      knownUnclaimedRef.current.add(conversation.id);

      if (!readMutedPreference()) {
        playGuestInboxSound();
      }

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        const name = guestDisplayName(conversation);
        try {
          new Notification("محادثة زائر جديدة", {
            body: `${name} بانتظار الاستلام`,
            tag: `guest-chat-${conversation.id}`,
            silent: true,
          });
        } catch {
          /* ignore */
        }
      }
    }

    for (const id of knownUnclaimedRef.current) {
      if (!currentIds.has(id)) {
        knownUnclaimedRef.current.delete(id);
      }
    }
  }, [conversations, loading]);

  const toggleSoundMuted = useCallback(() => {
    setSoundMuted((current) => {
      const next = !current;
      writeMutedPreference(next);
      return next;
    });
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }
    if (Notification.permission === "granted") {
      setNotificationPermission("granted");
      return true;
    }
    if (Notification.permission === "denied") {
      setNotificationPermission("denied");
      return false;
    }
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
    unlockGuestInboxAudio();
    return result === "granted";
  }, []);

  return {
    soundMuted,
    toggleSoundMuted,
    notificationPermission,
    requestNotificationPermission,
  };
}
