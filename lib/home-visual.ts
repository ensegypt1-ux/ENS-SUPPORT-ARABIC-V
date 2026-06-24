/** ENS support homepage — typography, surfaces, spacing, and brand accents. */
export const homeVisual = {
  /** Page atmosphere (applied on root shell) */
  shell: "support-home-shell bg-surface",

  /** Shared horizontal padding */
  pageX: "px-4 sm:px-6 lg:px-8",

  /** Section rhythm — tighter gaps, scales up on large screens */
  section:
    "scroll-mt-20 py-8 sm:scroll-mt-24 sm:py-10 lg:py-11",
  sectionHelp:
    "scroll-mt-20 bg-muted/25 py-8 dark:bg-muted/10 sm:scroll-mt-24 sm:py-10 lg:py-11",

  /** Content width — uses desktop space without feeling narrow */
  container:
    "mx-auto w-full max-w-[36rem] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl",

  /** Hero uses full container width */
  heroInner: "mx-auto w-full text-center",

  /** Hero atmosphere */
  heroSection:
    "relative scroll-mt-20 overflow-hidden pb-8 pt-2 sm:scroll-mt-24 sm:pb-10 sm:pt-4 lg:pb-12 lg:pt-5",
  heroGlow:
    "support-hero-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(480px,70vh)] lg:h-[min(520px,65vh)]",
  heroPanel:
    "relative rounded-2xl border border-border/50 bg-card/90 p-5 shadow-[0_1px_1px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-sm dark:shadow-[0_1px_1px_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.35)] sm:rounded-3xl sm:p-7 md:p-8 lg:p-10 xl:p-11",

  /** Typography hierarchy */
  brandMark: "mx-auto h-8 w-auto object-contain sm:h-9 lg:h-10",
  eyebrow:
    "inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[12px] font-semibold text-primary sm:text-[13px]",
  eyebrowDot: "h-1.5 w-1.5 shrink-0 rounded-full bg-primary",
  heroTitle:
    "mt-3 text-balance text-[1.75rem] font-bold leading-[1.15] tracking-tight text-foreground sm:mt-4 sm:text-[2.35rem] md:text-[2.65rem] lg:text-[3rem] lg:leading-[1.12]",
  heroSubtitle:
    "mx-auto mt-2.5 max-w-md text-[15px] leading-relaxed text-muted-foreground sm:mt-3 sm:max-w-lg sm:text-[16px] lg:max-w-2xl lg:text-[17px]",
  sectionTitle:
    "text-xl font-bold tracking-tight text-foreground sm:text-[1.375rem] lg:text-2xl",
  sectionDesc:
    "mt-1.5 text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]",
  fieldLabel: "mb-2 block text-[13px] font-semibold text-foreground sm:mb-2.5",

  /** Section header — stacks on mobile */
  sectionHeader:
    "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4",

  /** Surfaces & cards */
  surface:
    "rounded-2xl border border-border/55 bg-card shadow-sm shadow-black/[0.04] dark:shadow-black/25 sm:rounded-3xl",
  surfaceHover:
    "transition-[border-color,box-shadow] duration-200 hover:border-border hover:shadow-md hover:shadow-black/[0.05] dark:hover:shadow-black/30",
  surfacePad: "p-5 sm:p-6 lg:p-7",
  listDivider: "border-t border-border/45",
  journeyRow:
    "mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:mt-6 sm:gap-2",
  journeyStep:
    "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm transition-[border-color,background-color,box-shadow] duration-200 hover:border-primary/30 hover:bg-primary/[0.04] hover:shadow-sm sm:px-3 sm:py-1.5 sm:text-[12px]",
  journeyNum:
    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary sm:h-5 sm:w-5 sm:text-[11px]",

  /** ENSMenu product accent */
  ensMenuPanel: "support-ensmenu-panel ensmenu-surface p-4 sm:p-5 md:p-6 lg:p-7",
  ensMenuEyebrow: "ensmenu-eyebrow",
  ensMenuIcon: "text-[var(--ensmenu-accent)]",
  ensMenuHeader: "flex flex-col gap-4 text-start md:flex-row md:items-start md:justify-between md:gap-6",
  ensMenuActions:
    "flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap md:w-auto md:min-w-[11rem] md:flex-col lg:min-w-[12rem]",
  ensMenuActionBtn: "h-10 w-full justify-center sm:h-9 md:w-full lg:w-auto",
  ensMenuBtn:
    "rounded-lg bg-[var(--ensmenu-accent)] font-semibold text-white shadow-sm shadow-[color-mix(in_oklab,var(--ensmenu-accent)_35%,transparent)] hover:brightness-110",
  ensMenuOutline:
    "rounded-lg border-[color-mix(in_oklab,var(--ensmenu-accent)_28%,transparent)] font-semibold text-[var(--ensmenu-accent)] hover:bg-[color-mix(in_oklab,var(--ensmenu-accent)_7%,transparent)]",
  ensMenuHeroCta:
    "h-11 rounded-xl border-[color-mix(in_oklab,var(--ensmenu-accent)_30%,transparent)] font-semibold text-[var(--ensmenu-accent)] hover:bg-[color-mix(in_oklab,var(--ensmenu-accent)_6%,transparent)] sm:h-12",

  /** CTAs */
  ctaRow:
    "mt-6 flex flex-col gap-2 sm:mt-7 sm:flex-row sm:flex-wrap sm:justify-center lg:gap-2.5",
  ctaButton: "h-11 w-full sm:h-12 sm:w-auto sm:min-w-[9.75rem]",
  primaryCta:
    "rounded-xl px-6 font-semibold shadow-lg shadow-primary/25 sm:px-7",
  secondaryCta: "rounded-xl px-5 font-semibold",

  /** Help section — side-by-side on large screens */
  helpGrid:
    "grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-2 lg:items-start lg:gap-10 xl:gap-12",

  /** Guides category list — two columns from tablet landscape up */
  guidesList:
    "mt-5 grid grid-cols-1 gap-0.5 sm:mt-6 md:grid-cols-2 md:gap-x-4 md:gap-y-0.5",

  /** Topics pills */
  topicsRow: "mt-3 flex flex-wrap gap-1.5 sm:mt-3.5 sm:gap-2",
} as const;
