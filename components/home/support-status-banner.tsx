import { AlertTriangle, CheckCircle2, Info, Megaphone } from "lucide-react";
import type { SystemSettings } from "@/types/settings";
import { HOME_COPY } from "@/lib/home-support-copy";
import { supportMotion } from "@/lib/home-motion";
import { cn } from "@/lib/utils";

interface SupportStatusBannerProps {
  announcements: SystemSettings["announcements"];
  maintenance: SystemSettings["maintenance"];
}

export function SupportStatusBanner({
  announcements,
  maintenance,
}: SupportStatusBannerProps) {
  const showAnnouncement =
    announcements.enabled &&
    announcements.showOn.public &&
    announcements.message.trim().length > 0;

  const showMaintenance =
    maintenance.enabled && maintenance.message.trim().length > 0;

  if (!showAnnouncement && !showMaintenance) {
    return null;
  }

  const variant = showMaintenance ? "maintenance" : announcements.variant;
  const message = showMaintenance ? maintenance.message : announcements.message;
  const title = showMaintenance ? HOME_COPY.status.maintenance : announcements.title;

  const styles = {
    info: "border-sky-500/30 bg-sky-500/5 text-sky-900 dark:text-sky-100",
    success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-900 dark:text-emerald-100",
    warning: "border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-100",
    maintenance:
      "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-50",
  } as const;

  const Icon =
    variant === "maintenance" || variant === "warning"
      ? AlertTriangle
      : variant === "success"
        ? CheckCircle2
        : Megaphone;

  return (
    <div
      id="service-status"
      className={cn(
        "scroll-mt-24 border-b px-4 py-3",
        supportMotion.bannerEnter,
        styles[variant === "maintenance" ? "maintenance" : variant] ?? styles.info,
      )}
      role="status"
    >
      <div className="mx-auto flex max-w-[36rem] items-start gap-3 text-start sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          {title ? <p className="text-[13px] font-bold">{title}</p> : null}
          <p className="text-[13px] leading-relaxed opacity-90">{message}</p>
        </div>
      </div>
    </div>
  );
}
