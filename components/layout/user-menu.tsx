"use client";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User } from "lucide-react";
import { useSidebarCollapsed } from "@/components/layout/app-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NameWithRole } from "@/components/shared/name-with-role";
import { useCompanyInfo } from "@/components/providers/settings-provider";
import {
  getUserInitials,
  resolveUserDisplayName,
} from "@/lib/user-display";

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    role: string;
    image?: string;
  };
  variant?: "header" | "sidebar";
}

export function UserMenu({ user, variant = "header" }: UserMenuProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { name: companyName } = useCompanyInfo();
  const displayName = resolveUserDisplayName(user.name, user.email, companyName);
  const initials = getUserInitials(user.name, user.email, companyName);
  // Use user.image directly, but allow override from custom event
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | undefined>();
  const collapsed = useSidebarCollapsed();

  // Listen for avatar updates broadcast by the profile page upload
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ url?: string }>;
        if (ce.detail?.url) setCustomAvatarUrl(ce.detail.url);
      } catch {}
    };
    if (typeof window !== "undefined") {
      window.addEventListener("app:avatar-updated", handler as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "app:avatar-updated",
          handler as EventListener,
        );
      }
    };
  }, []);

  // Use custom avatar if available, otherwise fall back to user.image
  const avatarUrl = customAvatarUrl ?? user.image;
  // Profile path is role-based
  const profilePath =
    user.role === "admin"
      ? "/admin/profile"
      : user.role === "support"
        ? "/support-agent/profile"
        : "/dashboard/profile";

  // Settings path only available for admin
  const settingsPath = user.role === "admin" ? "/admin/settings" : null;

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      toast.success("خرجت");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("تعذّر الخروج");
      setIsLoading(false);
    }
  };

  if (variant === "sidebar") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2 transition-colors",
              collapsed
                ? "min-h-[3.35rem] flex-col justify-center gap-0.5 rounded-[0.9rem] p-1.5 bg-transparent hover:bg-slate-50"
                : "bg-muted/90 hover:bg-muted",
            )}
          >
            <Avatar
              className={cn(
                "h-8 w-8",
                collapsed &&
                  "h-7 w-7 border-0 bg-transparent shadow-none",
              )}
            >
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            {collapsed ? (
              <span className="text-center text-[9px] font-medium leading-3 text-slate-500">
                الحساب
              </span>
            ) : (
              <div className="flex-1 text-end">
                <NameWithRole
                  name={displayName}
                  role={user.role}
                  className="text-sm font-medium text-foreground"
                  badgeClassName="h-4 px-2 text-[10px]"
                />
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 text-end"
          align="end"
          forceMount
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1 text-end">
              <NameWithRole
                name={displayName}
                role={user.role}
                className="text-sm font-medium leading-none"
                badgeClassName="h-4 px-2 text-[10px]"
              />
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="justify-start gap-2"
            onClick={() => router.push(profilePath)}
          >
            <span className="flex-1 text-end">حسابي</span>
            <User className="h-4 w-4 shrink-0" />
          </DropdownMenuItem>
          <DropdownMenuItem
            className="justify-start gap-2"
            disabled={!settingsPath}
            onClick={() => settingsPath && router.push(settingsPath)}
          >
            <span className="flex-1 text-end">الإعدادات</span>
            <Settings className="h-4 w-4 shrink-0" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="justify-start gap-2"
            onClick={handleSignOut}
            disabled={isLoading}
          >
            <span className="flex-1 text-end">
              {isLoading ? "بيطلع..." : "خروج"}
            </span>
            <LogOut className="h-4 w-4 shrink-0 rtl:-scale-x-100" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 text-end"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1 text-end">
            <NameWithRole
              name={displayName}
              role={user.role}
              className="text-sm font-medium leading-none"
              badgeClassName="h-4 px-2 text-[10px]"
            />
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-start gap-2"
          onClick={() => router.push(profilePath)}
        >
          <span className="flex-1 text-end">حسابي</span>
          <User className="h-4 w-4 shrink-0" />
        </DropdownMenuItem>
        <DropdownMenuItem
          className="justify-start gap-2"
          disabled={!settingsPath}
          onClick={() => settingsPath && router.push(settingsPath)}
        >
          <span className="flex-1 text-end">الإعدادات</span>
          <Settings className="h-4 w-4 shrink-0" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-start gap-2"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          <span className="flex-1 text-end">
            {isLoading ? "بيطلع..." : "خروج"}
          </span>
          <LogOut className="h-4 w-4 shrink-0 rtl:-scale-x-100" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
