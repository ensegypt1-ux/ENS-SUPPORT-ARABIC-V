/** Public support portal navigation — workflow-first hierarchy. */

export type NavLinkEmphasis = "default" | "primary" | "ensmenu" | "muted";

export interface PortalNavLink {
  label: string;
  href: string;
  emphasis?: NavLinkEmphasis;
  /** Show only when user is signed in */
  authOnly?: boolean;
  /** Show only for guests */
  guestOnly?: boolean;
}

export interface PortalNavGroup {
  id: string;
  /** Visible label in mobile menu; optional on desktop */
  label: string;
  links: PortalNavLink[];
}

export const PORTAL_PRIMARY_CTA = {
  label: "افتح تذكرة",
  href: "/support/new",
  mobileLabel: "افتح تذكرة",
} as const;

/** Desktop + mobile nav — ordered by support workflow priority. */
export const PORTAL_NAV_GROUPS: PortalNavGroup[] = [
  {
    id: "tickets",
    label: "التذاكر",
    links: [
      {
        label: "طلباتي",
        href: "/dashboard/tickets",
        emphasis: "default",
        authOnly: true,
      },
      {
        label: "تابع طلباتك",
        href: "/login?callbackUrl=/dashboard/tickets",
        emphasis: "default",
        guestOnly: true,
      },
    ],
  },
  {
    id: "ensmenu",
    label: "ENSMenu",
    links: [
      {
        label: "دعم ENSMenu",
        href: "/#ensmenu-support",
        emphasis: "ensmenu",
      },
    ],
  },
  {
    id: "resources",
    label: "موارد الدعم",
    links: [
      {
        label: "قاعدة المعرفة",
        href: "/#guides",
        emphasis: "muted",
      },
    ],
  },
  {
    id: "help",
    label: "المساعدة",
    links: [
      {
        label: "أسئلة شائعة",
        href: "/#faq",
        emphasis: "muted",
      },
      {
        label: "تواصل",
        href: "/#contact",
        emphasis: "default",
      },
    ],
  },
];

export function filterPortalNavLinks(
  links: PortalNavLink[],
  isLoggedIn: boolean,
): PortalNavLink[] {
  return links.filter((link) => {
    if (link.authOnly && !isLoggedIn) return false;
    if (link.guestOnly && isLoggedIn) return false;
    return true;
  });
}

export function flattenPortalNav(isLoggedIn: boolean): PortalNavLink[] {
  return PORTAL_NAV_GROUPS.flatMap((group) =>
    filterPortalNavLinks(group.links, isLoggedIn),
  );
}

export const PORTAL_FOOTER_COLUMNS = [
  {
    key: "tickets" as const,
    title: "التذاكر",
    links: [
      { label: "افتح تذكرة", href: "/support/new" },
      { label: "طلباتي", href: "/login?callbackUrl=/dashboard/tickets" },
      { label: "تابع الطلب", href: "/login?callbackUrl=/dashboard/tickets" },
    ],
  },
  {
    key: "ensmenu" as const,
    title: "ENSMenu",
    links: [
      { label: "دعم ENSMenu", href: "/#ensmenu-support" },
      { label: "قاعدة معرفة ENSMenu", href: "/docs?q=ENSMenu" },
    ],
  },
  {
    key: "resources" as const,
    title: "موارد الدعم",
    links: [
      { label: "قاعدة المعرفة", href: "/docs" },
      { label: "أسئلة شائعة", href: "/#faq" },
      { label: "حالة الخدمة", href: "/#service-status" },
    ],
  },
  {
    key: "portal" as const,
    title: "البوابة",
    links: [
      { label: "مركز الدعم", href: "/" },
      { label: "تواصل", href: "/#contact" },
      { label: "دخول", href: "/login" },
    ],
  },
];

export function navLinkClassName(
  emphasis: NavLinkEmphasis = "default",
  active = false,
): string {
  const base =
    "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors whitespace-nowrap";

  if (active) {
    return `${base} bg-primary/10 text-primary`;
  }

  switch (emphasis) {
    case "ensmenu":
      return `${base} font-semibold text-violet-700 hover:bg-violet-500/10 dark:text-violet-300`;
    case "muted":
      return `${base} text-muted-foreground hover:bg-muted/70 hover:text-foreground`;
    case "primary":
      return `${base} font-semibold text-primary hover:bg-primary/10`;
    default:
      return `${base} text-foreground/75 hover:bg-muted/70 hover:text-foreground`;
  }
}
