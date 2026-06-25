"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isPwaRuntimeEnabled, registerPwaServiceWorker } from "@/lib/pwa/client";

const OFFLINE_RETURN_TO_KEY = "__solvio_offline_return_to__";
const OFFLINE_CONFIRM_MS = 2_500;
const OFFLINE_PROBE_TIMEOUT_MS = 4_000;

/** No-op in local dev unless NEXT_PUBLIC_ENABLE_DEV_PWA=true (see DevServiceWorkerReset). */
export function PwaBootstrap() {
  if (!isPwaRuntimeEnabled()) {
    return null;
  }

  return <PwaBootstrapActive />;
}

function PwaBootstrapActive() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const waitingForActivationRef = useRef(false);
  const offlineConfirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const offlineRedirectingRef = useRef(false);

  useEffect(() => {
    let active = true;

    const isOnlineReachable = async () => {
      if (!navigator.onLine) {
        return false;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          OFFLINE_PROBE_TIMEOUT_MS
        );

        const response = await fetch(`/?__online_check=${Date.now()}`, {
          method: "HEAD",
          cache: "no-store",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response.ok;
      } catch {
        return false;
      }
    };

    const clearOfflineConfirmTimer = () => {
      if (offlineConfirmTimerRef.current) {
        clearTimeout(offlineConfirmTimerRef.current);
        offlineConfirmTimerRef.current = null;
      }
    };

    const scheduleOfflineRedirect = () => {
      if (offlineRedirectingRef.current || offlineConfirmTimerRef.current) {
        return;
      }

      offlineConfirmTimerRef.current = setTimeout(() => {
        offlineConfirmTimerRef.current = null;
        if (!active || offlineRedirectingRef.current) {
          return;
        }

        void (async () => {
          const reachable = await isOnlineReachable();
          if (!active || reachable) {
            if (reachable) {
              setIsOffline(false);
            }
            return;
          }

          setIsOffline(true);

          if (window.location.pathname === "/offline") {
            return;
          }

          offlineRedirectingRef.current = true;
          window.sessionStorage.setItem(
            OFFLINE_RETURN_TO_KEY,
            `${window.location.pathname}${window.location.search}${window.location.hash}`
          );
          window.location.replace("/offline");
        })();
      }, OFFLINE_CONFIRM_MS);
    };

    const syncOfflineState = async () => {
      if (!active) {
        return;
      }

      if (window.location.pathname === "/offline") {
        const reachable = await isOnlineReachable();
        if (!active) return;

        if (reachable) {
          setIsOffline(false);
          const fallbackPath = "/";
          const returnTo =
            window.sessionStorage.getItem(OFFLINE_RETURN_TO_KEY) || fallbackPath;
          window.sessionStorage.removeItem(OFFLINE_RETURN_TO_KEY);
          offlineRedirectingRef.current = true;
          window.location.replace(returnTo);
        } else {
          setIsOffline(true);
        }
        return;
      }

      if (!navigator.onLine) {
        scheduleOfflineRedirect();
        return;
      }

      clearOfflineConfirmTimer();
      setIsOffline(false);
    };

    const monitorRegistration = (registration: ServiceWorkerRegistration) => {
      registrationRef.current = registration;

      if (registration.waiting && navigator.serviceWorker.controller) {
        setHasUpdate(true);
      }

      const watchInstallingWorker = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) {
          return;
        }

        installingWorker.addEventListener("statechange", () => {
          if (
            active &&
            installingWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setHasUpdate(true);
          }
        });
      };

      registration.addEventListener("updatefound", watchInstallingWorker);
      watchInstallingWorker();
    };

    const register = async () => {
      try {
        const registration = await registerPwaServiceWorker();
        if (active && registration) {
          monitorRegistration(registration);
          await registration.update();
          if (registration.waiting && navigator.serviceWorker.controller) {
            setHasUpdate(true);
          }
        }
      } catch (error) {
        console.error("Failed to register service worker:", error);
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        registrationRef.current
      ) {
        void registrationRef.current
          .update()
          .then(() => {
            if (
              registrationRef.current?.waiting &&
              navigator.serviceWorker.controller
            ) {
              setHasUpdate(true);
            }
          })
          .catch(() => undefined);
      }
    };

    const handleOffline = () => {
      scheduleOfflineRedirect();
    };

    const handleOnline = () => {
      clearOfflineConfirmTimer();
      void syncOfflineState();
    };

    const handleControllerChange = () => {
      if (!waitingForActivationRef.current) {
        return;
      }

      waitingForActivationRef.current = false;
      window.location.reload();
    };

    void register();
    void syncOfflineState();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    return () => {
      active = false;
      clearOfflineConfirmTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, []);

  const handleReloadUpdate = () => {
    setIsReloading(true);

    const waitingWorker = registrationRef.current?.waiting;
    if (waitingWorker) {
      waitingForActivationRef.current = true;
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      return;
    }

    window.location.reload();
  };

  if (!hasUpdate && !isOffline) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed end-3 top-3 z-[100] flex items-center gap-2 max-sm:flex-col max-sm:items-end">
      {isOffline && (
        <div className="pointer-events-auto inline-flex items-center rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground shadow-lg">
          غير متصل
        </div>
      )}
      {hasUpdate && (
        <>
          <div className="pointer-events-auto inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-lg">
            تحديث التطبيق متاح
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleReloadUpdate}
            disabled={isReloading}
            className="pointer-events-auto rounded-full px-3"
          >
            {isReloading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                جاري إعادة التحميل...
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                إعادة تحميل التطبيق
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
