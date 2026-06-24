import { cn } from "@/lib/utils";

/** Physical RTL table shell: actions column on the left, primary content on the right. */
export function adminTableShellClass(className?: string) {
  return cn(
    "overflow-hidden rounded-lg border border-border bg-card/50 backdrop-blur-sm",
    className
  );
}

export const adminTableShellDir = { direction: "ltr" } as const;

export function adminTableCellRtl(className?: string) {
  return cn("px-4 py-3.5", className);
}
