"use client";

import { useCallback, useEffect, useState } from "react";
import type { AIChatbotPublicConfig } from "@/types";

/**
 * Fetches the public AI chatbot config (`/api/ai/chat/config`).
 * Returns `null` until loaded; `config.enabled` reflects the admin toggle.
 * Refetches when the tab regains focus so dashboard branding updates apply.
 */
export function useAiChatConfig(): AIChatbotPublicConfig | null {
  const [config, setConfig] = useState<AIChatbotPublicConfig | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/ai/chat/config", { cache: "no-store" });
      const data = (await response.json()) as AIChatbotPublicConfig;
      setConfig(data);
    } catch {
      /* keep previous config on transient errors */
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    const onFocus = () => {
      void loadConfig();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadConfig]);

  return config;
}
