import { cn } from "@/lib/utils";

/** Two-column settings layout: form body left, section nav right (physical RTL). */
export function PanelFormLayout({
  nav,
  children,
  className,
}: {
  nav?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-6 lg:grid-cols-[minmax(0,1fr)_11rem] lg:items-start lg:gap-8",
        className
      )}
      style={{ direction: "ltr" }}
    >
      <div
        className="min-w-0 space-y-6 text-right lg:col-start-1 lg:row-start-1"
        dir="rtl"
      >
        {children}
      </div>
      {nav ? (
        <div className="hidden lg:col-start-2 lg:row-start-1 lg:block">{nav}</div>
      ) : null}
    </div>
  );
}

export const panelFormHeaderRowClass =
  "flex w-full flex-row-reverse items-center gap-3 text-start";

/** Card/section header: actions on the left, title + description on the right (physical RTL). */
export function PanelSectionHeader({
  title,
  description,
  actions,
  icon,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid w-full gap-4 max-sm:grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start",
        className
      )}
      style={{ direction: "ltr" }}
    >
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 max-sm:order-2 sm:col-start-1 sm:row-start-1">
          {actions}
        </div>
      ) : null}
      <div
        className={cn(
          "flex min-w-0 w-full flex-col items-end text-right max-sm:order-1",
          actions ? "sm:col-start-2 sm:row-start-1" : "sm:col-span-2"
        )}
        dir="ltr"
      >
        <div
          className="inline-flex w-full flex-row items-center justify-end gap-2 text-base font-semibold leading-none text-foreground"
          dir="ltr"
        >
          <span>{title}</span>
          {icon ? <span className="shrink-0">{icon}</span> : null}
        </div>
        {description ? (
          <p
            className="mt-1 w-full text-right text-sm text-muted-foreground"
            dir="rtl"
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Card heading without actions — title on the right, icon after title. */
export function PanelCardHeading({
  title,
  description,
  icon,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full text-right", className)} dir="ltr">
      <div
        className="inline-flex w-full flex-row items-center justify-end gap-2 text-base font-semibold leading-none text-foreground"
        dir="ltr"
      >
        <span>{title}</span>
        {icon ? <span className="shrink-0">{icon}</span> : null}
      </div>
      {description ? (
        <p
          className="mt-1 w-full text-right text-sm text-muted-foreground"
          dir="rtl"
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

/** List row: actions left, content right (physical RTL). */
export const panelListRowClass =
  "grid gap-3 py-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center";

export const panelListRowStyle = { direction: "ltr" } as const;

/** Card / page header row: title on the right, icon after title (physical RTL). */
export function PanelFormHeader({
  icon,
  title,
  description,
  className,
  iconWrapperClassName,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  iconWrapperClassName?: string;
}) {
  return (
    <div className={cn("w-full text-right", className)} dir="ltr">
      <div className="inline-flex w-full flex-row items-center justify-end gap-3 text-xl font-semibold leading-none text-foreground">
        <span>{title}</span>
        {icon ? (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10",
              iconWrapperClassName
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      {description ? (
        <p
          className="mt-1 w-full text-right text-sm text-muted-foreground"
          dir="rtl"
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

/** Inline card title with leading icon (RTL). */
export function PanelCardTitle({
  icon,
  children,
  className,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-row items-center gap-2 text-start text-base font-semibold leading-none",
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}

/** Sticky save bar: primary action left, hint text right. */
export function PanelFormActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-row-reverse items-center justify-start gap-3 text-start",
        className
      )}
      style={{ direction: "ltr" }}
    >
      {children}
    </div>
  );
}

/** Switch on the left, label on the right. */
export function PanelSwitchField({
  label,
  description,
  control,
  className,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  control: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center",
        className
      )}
      style={{ direction: "ltr" }}
    >
      <div className="sm:col-start-1 sm:row-start-1">{control}</div>
      <div className="text-right sm:col-start-2 sm:row-start-1" dir="rtl">
        <p className="text-sm font-medium">{label}</p>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Action buttons on the left, text on the right. */
export function PanelActionRow({
  label,
  description,
  actions,
  className,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  actions: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(panelListRowClass, "rounded-lg border border-border bg-muted/30 p-4", className)}
      style={panelListRowStyle}
    >
      <div className="flex flex-wrap items-center gap-2 sm:col-start-1 sm:row-start-1">
        {actions}
      </div>
      <div className="text-right sm:col-start-2 sm:row-start-1" dir="rtl">
        {typeof label === "string" ? (
          <p className="text-sm font-medium">{label}</p>
        ) : (
          label
        )}
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Label + switch row (RTL): label on the right, control on the left. */
export function PanelSwitchRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-row items-center justify-between gap-4 rounded-xl border bg-muted/20 p-4 text-start transition-colors hover:bg-muted/30",
        className
      )}
    >
      {children}
    </div>
  );
}
