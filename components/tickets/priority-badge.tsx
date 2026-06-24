import { Badge } from "@/components/ui/badge";
import type { TicketPriority } from "@/types";
import { cn } from "@/lib/utils";
import { PRIORITY_LABELS } from "@/lib/strings";
import { AlertCircle, ArrowUp, ArrowDown, Minus } from "lucide-react";

interface PriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
  showIcon?: boolean;
}

const priorityConfig: Record<
  TicketPriority,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
    icon: typeof AlertCircle;
  }
> = {
  urgent: {
    variant: "default",
    className: "bg-destructive/15 text-destructive hover:bg-destructive/20",
    icon: AlertCircle,
  },
  high: {
    variant: "default",
    className: "bg-warning/15 text-warning hover:bg-warning/20",
    icon: ArrowUp,
  },
  medium: {
    variant: "default",
    className: "bg-info/15 text-info hover:bg-info/20",
    icon: Minus,
  },
  low: {
    variant: "default",
    className: "bg-success/15 text-success hover:bg-success/20",
    icon: ArrowDown,
  },
};

export function PriorityBadge({
  priority,
  className,
  showIcon = false,
}: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {showIcon && <Icon className="me-1 h-3 w-3" />}
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
