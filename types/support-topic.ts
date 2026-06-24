import type { LucideIcon } from "lucide-react";

export interface SupportTopic {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  colorClass: string;
}
