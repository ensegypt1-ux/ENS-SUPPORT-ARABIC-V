"use client";

import { DEV_PWA_CLEANUP_KEY } from "@/lib/pwa/constants";

const SERVICE_WORKER_PATH = "/sw.js";
const CACHE_PREFIX = "solvio-pwa-";

function isLocalhost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

export function supportsServiceWorker() {
  return typeof window !== "undefined" && "serviceWorker" in navigator;
}

export function supportsPushNotifications() {
  return (
    supportsServiceWorker() &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function canUseServiceWorker() {
  return (
    supportsServiceWorker() &&
    (window.isSecureContext || isLocalhost(window.location.hostname))
  );
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function isDevPwaEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_DEV_PWA === "true";
}

/** True when the app should keep an active service worker (prod or explicit dev PWA). */
export function isPwaRuntimeEnabled() {
  return isProduction() || isDevPwaEnabled();
}

async function clearPwaCaches() {
  if (typeof window === "undefined" || !("caches" in window)) {
    return;
  }

  const cacheKeys = await caches.keys();
  await Promise.all(
    cacheKeys
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .map((key) => caches.delete(key))
  );
}

export async function unregisterPwaServiceWorker() {
  if (!supportsServiceWorker()) {
    return false;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  const localRegistrations = registrations.filter((registration) => {
    try {
      return new URL(registration.scope).origin === window.location.origin;
    } catch {
      return false;
    }
  });

  await Promise.all(
    localRegistrations.map((registration) => registration.unregister())
  );
  await clearPwaCaches();

  return localRegistrations.length > 0;
}

/**
 * In local dev (without NEXT_PUBLIC_ENABLE_DEV_PWA), remove any stale SW once
 * per browser tab. Must NOT run on every navigation — unregister triggers
 * controllerchange and was causing infinite full-page reload loops.
 */
export async function ensureDevServiceWorkerDisabled() {
  if (isPwaRuntimeEnabled() || !supportsServiceWorker()) {
    return false;
  }

  if (typeof window !== "undefined") {
    try {
      if (window.sessionStorage.getItem(DEV_PWA_CLEANUP_KEY) === "1") {
        return false;
      }
      window.sessionStorage.setItem(DEV_PWA_CLEANUP_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  const removed = await unregisterPwaServiceWorker();

  return removed;
}

export async function registerPwaServiceWorker() {
  if (!canUseServiceWorker()) {
    return null;
  }

  if (!isPwaRuntimeEnabled()) {
    await ensureDevServiceWorkerDisabled();
    return null;
  }

  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) {
    return existing;
  }

  return navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
    scope: "/",
  });
}

export async function getPwaServiceWorkerRegistration() {
  if (!canUseServiceWorker() || !isPwaRuntimeEnabled()) {
    return null;
  }

  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) {
    return existing;
  }

  return registerPwaServiceWorker();
}

/**
 * Service worker registration for Web Push — works whenever the browser
 * supports it (secure context / localhost), even when full PWA runtime is
 * disabled in local dev.
 */
export async function getPushServiceWorkerRegistration() {
  if (!canUseServiceWorker()) {
    return null;
  }

  try {
    let registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration) {
      registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
        scope: "/",
      });
    }

    await navigator.serviceWorker.ready;

    if (!registration.active) {
      await new Promise<void>((resolve, reject) => {
        const worker = registration!.installing || registration!.waiting;
        if (!worker) {
          resolve();
          return;
        }

        const timeout = window.setTimeout(() => {
          reject(new Error("Service worker activation timed out."));
        }, 15_000);

        worker.addEventListener("statechange", () => {
          if (worker.state === "activated" || registration!.active) {
            window.clearTimeout(timeout);
            resolve();
          }
          if (worker.state === "redundant") {
            window.clearTimeout(timeout);
            reject(new Error("Service worker became redundant."));
          }
        });
      });
    }

    return registration;
  } catch (error) {
    console.error("[push] service worker registration failed:", error);
    return null;
  }
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
}
