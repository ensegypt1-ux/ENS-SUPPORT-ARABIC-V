import { Loader2 } from "lucide-react";

import { UI } from "@/lib/strings";
import { cn } from "@/lib/utils";

const SPINNER_SIZES = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
} as const;

export type SpinnerSize = keyof typeof SPINNER_SIZES;

/** Consistent inline spinner — use inside buttons, inputs, and compact rows. */
export function Spinner({
  size = "md",
  className,
}: {
  size?: SpinnerSize;
  className?: string;
}) {
  return (
    <Loader2
      aria-hidden
      className={cn(SPINNER_SIZES[size], "animate-spin", className)}
    />
  );
}

/** Centered page/section loader with optional label. */
export function PageSpinner({
  label = UI.loading,
  className,
  minHeight = "min-h-[50vh]",
}: {
  label?: string | null;
  className?: string;
  minHeight?: string;
}) {
  return (
    <div
      className={cn("flex items-center justify-center", minHeight, className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <Spinner size="lg" className="text-primary/80" />
        {label ? (
          <p className="text-sm text-muted-foreground">{label}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Compact inline row loader for cards and panels. */
export function InlineLoading({
  label = UI.loading,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center justify-center gap-2 py-10", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner size="sm" className="text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
