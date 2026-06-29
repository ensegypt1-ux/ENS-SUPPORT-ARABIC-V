"use client";

/**
 * Standalone, chrome-free chat widget page.
 *
 * Loaded INSIDE the iframe injected by /public/widget.js on third-party sites.
 * It renders only the launcher bubble + ChatWindow and tells the parent page
 * (via postMessage) what size the iframe should be so the rest of the host
 * page stays clickable when the chat is closed.
 *
 * Single-org with optional site keys: a key scopes answers to one site's
 * knowledge plus Global sources.
 */

import { useCallback, useEffect, useState } from "react";
import { WidgetLauncherSkeleton } from "@/components/ui/loading";
import { ChatWindow } from "@/components/ai-chat/chat-window";
import { WidgetLauncherButton } from "@/components/ai-chat/widget-launcher-button";
import { cn } from "@/lib/utils";
import type { AIChatbotPublicConfig } from "@/types";

// Shared with public/widget.js — keep in sync.
const WIDGET_MSG_SOURCE = "solvio-widget";

/** Validate the ?host= param and normalise it to a bare origin. */
function readHostOrigin(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw =
      new URLSearchParams(window.location.search).get("host") ||
      document.referrer;
    if (!raw) return "";
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.origin;
  } catch {
    return "";
  }
}

/** Read the optional per-site embed key from the `?key=` param. */
function readSiteKey(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("key") ?? "";
}

export default function EmbedPage() {
  const [config, setConfig] = useState<AIChatbotPublicConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [hostOrigin] = useState(() => readHostOrigin());
  const [siteKey] = useState(() => readSiteKey());
  const storageNamespace = [hostOrigin, siteKey].filter(Boolean).join("::");

  // The widget renders inside a same-origin iframe that injects no chrome. When
  // the embedder's OS is in dark mode, next-themes (defaultTheme="system") adds
  // `.dark` to this document and `color-scheme: dark` takes effect, which makes
  // the browser paint a dark viewport canvas *behind* the transparent iframe —
  // showing up as a black box behind the bubble and around the chat window — and
  // also flips `--background` to near-black so the window itself renders dark.
  //
  // Keep the widget consistently light regardless of the host's theme. We mutate
  // only this iframe document's <html> (never localStorage), so the main app's
  // theme in other tabs is untouched. A MutationObserver re-strips `.dark` if
  // next-themes reapplies it on a system-preference change.
  useEffect(() => {
    const root = document.documentElement;
    const forceLight = () => {
      root.classList.remove("dark");
      // `light` (not `normal`) is required: `normal` honours the OS, so a
      // dark-mode machine still gets a dark iframe backdrop behind the
      // transparent body. `light` + the explicit transparent background keeps
      // the iframe see-through.
      root.style.colorScheme = "light";
      root.style.background = "transparent";
      if (document.body) document.body.style.background = "transparent";
    };
    forceLight();
    const observer = new MutationObserver(forceLight);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      try {
        const response = await fetch("/api/ai/chat/config", { cache: "no-store" });
        const data = (await response.json()) as AIChatbotPublicConfig;
        if (!cancelled) setConfig(data);
      } catch {
        /* ignore */
      }
    };

    void loadConfig();

    const onFocus = () => {
      void loadConfig();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Tell the parent how big the iframe needs to be. Scope the message to the
  // known host origin; fall back to "*" only when it couldn't be determined.
  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return;
    window.parent.postMessage(
      {
        source: WIDGET_MSG_SOURCE,
        type: "resize",
        state: open ? "open" : "closed",
        position: config?.position,
        widgetWidth: config?.widgetWidth,
        widgetHeight: config?.widgetHeight,
      },
      hostOrigin || "*"
    );
  }, [config, open, hostOrigin]);

  const handleClose = useCallback(() => setOpen(false), []);

  if (!config) {
    return <WidgetLauncherSkeleton />;
  }

  if (!config.enabled) return null;

  return (
    <>
      {/* The host page may have any background; keep the iframe see-through
          so only the bubble/window are visible. */}
      <style>{`html,body{background:transparent!important;color-scheme:light!important;margin:0;padding:0;overflow:hidden}`}</style>

      <div
        className={cn(
          "fixed inset-0 flex flex-col justify-end gap-3 p-4",
          config.position === "bottom-left" ? "items-start" : "items-end"
        )}
      >
        <div
          className={cn(
            "w-full transition-all duration-300 ease-out",
            open
              ? "translate-y-0 opacity-100"
              : "pointer-events-none fixed -bottom-[9999px] translate-y-2 opacity-0"
          )}
          aria-hidden={!open}
        >
          <ChatWindow
            config={config}
            onClose={handleClose}
            embedded
            appOrigin={
              typeof window !== "undefined" ? window.location.origin : ""
            }
            siteKey={siteKey}
            host={hostOrigin}
            storageNamespace={storageNamespace}
          />
        </div>

        {!open && (
          <WidgetLauncherButton
            headerAvatarUrl={config.headerAvatarUrl}
            primaryColor={config.primaryColor}
            onClick={() => setOpen(true)}
            variant="embed"
            ariaLabel="فتح المحادثة"
            title="فتح المحادثة"
          />
        )}
      </div>
    </>
  );
}
