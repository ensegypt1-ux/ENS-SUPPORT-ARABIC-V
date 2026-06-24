import { Badge } from "@/components/ui/badge";
import type { TicketStatus } from "@/types";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/strings";

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

const statusConfig: Record<
  TicketStatus,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
  }
> = {
  open: {
    variant: "default",
    className: "bg-info/15 text-info hover:bg-info/20",
  },
  scheduled_meeting: {
    variant: "default",
    className:
      "bg-purple-500/15 text-purple-700 dark:text-purple-400 hover:bg-purple-500/20",
  },
  in_progress: {
    variant: "default",
    className: "bg-primary/15 text-primary hover:bg-primary/20",
  },
  waiting_on_customer: {
    variant: "default",
    className: "bg-warning/15 text-warning hover:bg-warning/20",
  },
  resolved: {
    variant: "default",
    className: "bg-success/15 text-success hover:bg-success/20",
  },
  closed: {
    variant: "default",
    className: "bg-muted text-foreground",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.replace(/-/g, "_") as TicketStatus;
  const config = statusConfig[normalizedStatus];

  if (!config) {
    return (
      <Badge
        variant="default"
        className={cn("bg-muted text-foreground", className)}
      >
        {status}
      </Badge>
    );
  }

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {STATUS_LABELS[normalizedStatus]}
    </Badge>
  );
}
