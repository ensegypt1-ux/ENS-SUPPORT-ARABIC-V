import { cn } from "@/lib/utils";

/** Standard admin page title block — physical RTL layout (toolbar left, title right). */
export function AdminPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "panel-page-header grid w-full gap-4 max-sm:grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start",
        className
      )}
      style={{ direction: "ltr" }}
    >
      {actions ? (
        <div className="panel-page-toolbar flex shrink-0 flex-wrap items-center gap-2 max-sm:order-2 sm:col-start-1 sm:row-start-1">
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
        <h1
          className="inline-flex w-full flex-row items-center justify-end gap-2 text-2xl font-bold leading-snug text-foreground md:text-3xl"
          dir="ltr"
        >
          {title}
        </h1>
        {description ? (
          <p
            className="mt-1 w-full max-w-3xl text-right text-sm leading-relaxed text-muted-foreground md:text-base"
            dir="rtl"
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
