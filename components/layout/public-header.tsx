"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ArrowLeft, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Logo } from "@/components/ui/logo";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "@/components/layout/user-menu";
import type { HeaderSection } from "@/types/landing-page";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useWhatsAppSettings, useCompanyInfo } from "@/components/providers/settings-provider";
import { resolveUserDisplayName } from "@/lib/user-display";
import {
  PORTAL_NAV_GROUPS,
  PORTAL_PRIMARY_CTA,
  filterPortalNavLinks,
  navLinkClassName,
  type PortalNavLink,
} from "@/lib/public-portal-nav";
import { buildWhatsAppUrl } from "@/lib/phone/international-phone";

interface PublicHeaderProps {
  variant?: "landing" | "auth";
  header?: HeaderSection;
}

const authFallbackLinks: PortalNavLink[] = [
  { label: "مركز الدعم", href: "/" },
  { label: "قاعدة المعرفة", href: "/docs", emphasis: "muted" },
];

export function PublicHeader({ variant = "landing", header }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentHash, setCurrentHash] = useState("");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const whatsapp = useWhatsAppSettings();
  const { name: companyName } = useCompanyInfo();

  const isLoggedIn = mounted && Boolean(session?.user);
  const showAuthSkeleton = !mounted || isPending;
  const h = header;
  const signInText = h?.signInText ?? "دخول";
  const ctaLabel = h?.ctaButtonText ?? PORTAL_PRIMARY_CTA.label;
  const ctaHref = h?.ctaButtonLink ?? PORTAL_PRIMARY_CTA.href;
  const mobileCtaLabel = h?.mobileCtaText ?? PORTAL_PRIMARY_CTA.mobileLabel;
  const guestCtaLink = PORTAL_PRIMARY_CTA.href;

  const navGroups =
    variant === "landing"
      ? PORTAL_NAV_GROUPS
      : [
          {
            id: "auth",
            label: "التنقل",
            links: authFallbackLinks,
          },
        ];

  const whatsappUrl =
    whatsapp?.enabled && whatsapp.phoneNumber
      ? buildWhatsAppUrl(
          whatsapp.phoneNumber,
          whatsapp.defaultMessage || "مرحباً! لدي استفسار."
        )
      : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const syncHash = () => setCurrentHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const normalizePath = (path: string) => {
    if (!path || path === "/") return "/";
    return path.endsWith("/") ? path.slice(0, -1) : path;
  };

  const getHashFromHref = (href: string) => {
    const hashIndex = href.indexOf("#");
    return hashIndex >= 0 ? href.slice(hashIndex) : "";
  };

  const isLinkActive = (href: string) => {
    if (
      href.startsWith("http") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      return false;
    }

    const [pathPart, hashPart] = href.split("#");
    const linkPath = normalizePath(pathPart || "/");
    const activePath = normalizePath(pathname);
    const linkHash = hashPart ? `#${hashPart}` : "";

    if (linkHash) {
      return activePath === linkPath && currentHash === linkHash;
    }

    if (linkPath === "/") {
      return activePath === "/" && currentHash === "";
    }

    return activePath === linkPath || activePath.startsWith(`${linkPath}/`);
  };

  const renderNavLink = (
    link: PortalNavLink,
    onNavigate?: () => void,
    mobile = false,
  ) => {
    const active = isLinkActive(link.href);
    return (
      <Link
        key={`${link.href}-${link.label}`}
        href={link.href}
        onClick={() => {
          setCurrentHash(getHashFromHref(link.href));
          onNavigate?.();
        }}
        className={cn(
          navLinkClassName(link.emphasis, active),
          mobile && "w-full rounded-xl px-3.5 py-2.5 text-[14px]",
        )}
      >
        {link.label}
      </Link>
    );
  };

  const elevated = scrolled || mobileMenuOpen;

  return (
    <header className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-4">
      <div
        className={cn(
          "mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 rounded-2xl border px-3 transition-all duration-300 sm:gap-3 sm:px-4",
          elevated
            ? "border-border/60 bg-background/85 shadow-lg shadow-black/[0.06] backdrop-blur-xl dark:bg-background/75 dark:shadow-black/30"
            : "border-border/40 bg-background/60 shadow-sm shadow-black/[0.03] backdrop-blur-md dark:bg-background/50",
        )}
      >
        <Link href="/" className="flex shrink-0 items-center">
          <Logo width={100} height={40} className="h-7 w-auto" showFallbackText />
        </Link>

        {/* Desktop — grouped workflow nav */}
        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex"
          aria-label="تنقل مركز الدعم"
        >
          {navGroups.map((group, groupIndex) => {
            const visibleLinks = filterPortalNavLinks(group.links, isLoggedIn);
            if (visibleLinks.length === 0) return null;

            return (
              <div key={group.id} className="flex items-center">
                {groupIndex > 0 ? (
                  <span
                    aria-hidden
                    className="mx-1.5 hidden h-4 w-px bg-border/70 lg:block"
                  />
                ) : null}
                <div className="flex items-center gap-0.5">
                  {visibleLinks.map((link) => renderNavLink(link))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Tablet — compact nav */}
        <nav
          className="hidden min-w-0 items-center gap-0.5 md:flex lg:hidden"
          aria-label="تنقل مركز الدعم"
        >
          {filterPortalNavLinks(
            navGroups.flatMap((g) => g.links),
            isLoggedIn,
          )
            .filter((link) => link.emphasis !== "muted")
            .slice(0, 4)
            .map((link) => renderNavLink(link))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="راسلنا على واتساب"
              title="راسلنا على واتساب"
              className="inline-flex shrink-0 items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
              <Image
                src="/whatsapp.png"
                alt="واتساب"
                width={28}
                height={28}
                className="h-7 w-7"
              />
            </a>
          ) : null}

          <div className="hidden sm:block">
            <ThemeToggle withLabel={false} />
          </div>

          {showAuthSkeleton ? (
            <Skeleton className="h-9 w-24 rounded-full" />
          ) : session?.user ? (
            <div className="hidden items-center gap-2 md:flex">
              {(session.user as SessionUser).role !== "admin" &&
                (session.user as SessionUser).role !== "support" && (
                  <Button
                    size="sm"
                    className="group h-9 rounded-full px-4 text-[13px] font-bold shadow-md shadow-primary/20"
                    asChild
                  >
                    <Link href={ctaHref}>
                      {ctaLabel}
                      <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                    </Link>
                  </Button>
                )}
              <UserMenu
                user={{
                  name: session.user.name ?? "مستخدم غير معروف",
                  email: session.user.email ?? "",
                  role: (session.user as SessionUser).role ?? "customer",
                  image: (session.user as SessionUser).image ?? "",
                }}
                variant="header"
              />
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 md:flex">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-full px-3 text-[13px] font-medium text-muted-foreground"
                asChild
              >
                <Link href="/login">{signInText}</Link>
              </Button>
              <Button
                size="sm"
                className="group h-9 rounded-full px-4 text-[13px] font-bold shadow-md shadow-primary/20"
                asChild
              >
                <Link href={guestCtaLink}>
                  {ctaLabel}
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                </Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="فتح/إغلاق القائمة"
          >
            {mobileMenuOpen ? (
              <X className="h-4.5 w-4.5" />
            ) : (
              <Menu className="h-4.5 w-4.5" />
            )}
          </Button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="mx-auto mt-2 max-w-6xl rounded-2xl border border-border/60 bg-background/95 p-4 shadow-xl backdrop-blur-xl md:hidden">
          {/* Primary CTA — always first on mobile */}
          <div className="mb-4 space-y-2">
            <Button size="lg" className="group h-11 w-full rounded-xl font-bold" asChild>
              <Link
                href={guestCtaLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                {mobileCtaLabel}
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              </Link>
            </Button>
            {!isLoggedIn ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl"
                asChild
              >
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  {signInText} للمتابعة
                </Link>
              </Button>
            ) : null}
          </div>

          <nav className="space-y-4">
            {navGroups.map((group) => {
              const visibleLinks = filterPortalNavLinks(group.links, isLoggedIn);
              if (visibleLinks.length === 0) return null;

              return (
                <div key={group.id}>
                  <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {visibleLinks.map((link) =>
                      renderNavLink(link, () => setMobileMenuOpen(false), true),
                    )}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-border/60 px-1 pt-3 sm:hidden">
            <ThemeToggle withLabel={true} />
          </div>

          {!showAuthSkeleton && session?.user ? (
            <div className="mt-4 border-t border-border/60 pt-3">
              <div className="rounded-xl bg-muted/40 px-3.5 py-2.5">
                <p className="text-[13px] font-semibold text-foreground">
                  {resolveUserDisplayName(
                    session.user.name,
                    session.user.email,
                    companyName,
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full rounded-xl text-[13px]"
                asChild
              >
                <Link
                  href={
                    (session.user as SessionUser).role === "admin" ||
                    (session.user as SessionUser).role === "support"
                      ? "/admin"
                      : "/dashboard"
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  لوحة التحكم
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
