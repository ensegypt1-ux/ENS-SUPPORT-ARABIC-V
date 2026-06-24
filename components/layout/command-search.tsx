"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Mail,
  Briefcase,
  BookOpen,
  UserCheck,
  Users,
  Settings,
  Ticket,
  Plus,
  User,
  Home,
  type LucideIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface NavPage {
  name: string;
  href: string;
  icon: LucideIcon;
  section: string;
}

function getAdminPages(role: string): NavPage[] {
  const pages: (NavPage & { roles: string[] })[] = [
    { name: "لوحة التحكم", href: "/admin", icon: LayoutDashboard, section: "نظرة عامة", roles: ["admin", "support"] },
    { name: "جميع التذاكر", href: "/admin/tickets", icon: FileText, section: "الدعم", roles: ["admin", "support"] },
    { name: "الرسائل", href: "/admin/messages", icon: MessageSquare, section: "الدعم", roles: ["admin", "support"] },
    { name: "النشرة الإخبارية", href: "/admin/newsletter", icon: Mail, section: "الدعم", roles: ["admin"] },
    { name: "قاعدة المعرفة", href: "/admin/knowledge-base", icon: BookOpen, section: "إدارة المحتوى", roles: ["admin"] },
    { name: "العملاء", href: "/admin/customers", icon: UserCheck, section: "الإدارة", roles: ["admin", "support"] },
    { name: "أعضاء الفريق", href: "/admin/users", icon: Users, section: "الإدارة", roles: ["admin"] },
    { name: "الإعدادات", href: "/admin/settings", icon: Settings, section: "الإدارة", roles: ["admin"] },
  ];
  return pages.filter((p) => p.roles.includes(role));
}

function getDashboardPages(): NavPage[] {
  return [
    { name: "لوحة التحكم", href: "/dashboard", icon: Home, section: "نظرة عامة" },
    { name: "جميع التذاكر", href: "/dashboard/tickets", icon: FileText, section: "الدعم" },
    { name: "تذكرة جديدة", href: "/dashboard/tickets/new", icon: Plus, section: "الدعم" },
    { name: "الرسائل", href: "/dashboard/messages", icon: MessageSquare, section: "الدعم" },
    { name: "الملف الشخصي", href: "/dashboard/profile", icon: User, section: "الحساب" },
  ];
}

function getSupportPages(): NavPage[] {
  return [
    { name: "لوحة التحكم", href: "/support-agent", icon: LayoutDashboard, section: "نظرة عامة" },
    { name: "جميع التذاكر", href: "/support-agent/tickets", icon: Ticket, section: "الدعم" },
    { name: "الرسائل", href: "/support-agent/messages", icon: MessageSquare, section: "الدعم" },
  ];
}

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: string;
  services?: Array<{ name: string; slug: string }>;
}

export function CommandSearch({
  open,
  onOpenChange,
  userRole,
  services = [],
}: CommandSearchProps) {
  const router = useRouter();

  const runCommand = useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange]
  );

  const isAdmin = userRole === "admin" || userRole === "support";
  const isDashboard = userRole === "customer";
  const isSupport = userRole === "support";

  const pages = isAdmin
    ? getAdminPages(userRole)
    : isDashboard
      ? getDashboardPages()
      : getSupportPages();

  const servicePages: NavPage[] = services.map((s) => {
    const basePath = isAdmin ? "/admin" : isDashboard ? "/dashboard" : "/support-agent";
    return {
      name: s.name,
      href: `${basePath}/services/${s.slug}`,
      icon: Briefcase,
      section: "الخدمات",
    };
  });

  const sections = new Map<string, NavPage[]>();
  for (const page of [...pages, ...servicePages]) {
    const group = sections.get(page.section) ?? [];
    group.push(page);
    sections.set(page.section, group);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="البحث في الصفحات..." />
      <CommandList>
        <CommandEmpty>مفيش نتائج.</CommandEmpty>
        {Array.from(sections.entries()).map(([section, items]) => (
          <CommandGroup key={section} heading={section}>
            {items.map((item) => (
              <CommandItem
                key={item.href}
                value={`${item.name} ${item.section}`}
                onSelect={() =>
                  runCommand(() => router.push(item.href))
                }
              >
                <item.icon className="me-2 h-4 w-4 text-muted-foreground" />
                <span>{item.name}</span>
                <span className="ms-auto text-xs text-muted-foreground">
                  {item.href}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}
