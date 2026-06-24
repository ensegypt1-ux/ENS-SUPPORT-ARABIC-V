/** Shared motion + interaction classes for the support homepage. */
export const supportMotion = {
  /** Primary / outline buttons in hero and sections */
  button:
    "transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",

  /** Text links with underline on hover */
  textLink:
    "rounded-sm transition-colors duration-200 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1",

  /** Search suggestion chips */
  chip:
    "rounded-full transition-[background-color,color,transform] duration-200 ease-out hover:bg-primary/10 hover:text-primary active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",

  /** List row links (guides, ENSMenu articles) */
  listRow:
    "group flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-start transition-[background-color,color,transform] duration-200 ease-out hover:bg-muted/50 active:scale-[0.995] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",

  /** Chevron / arrow that appears on row hover */
  rowArrow:
    "h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover:opacity-100 group-hover:-translate-x-0.5 group-focus-visible:opacity-100 motion-reduce:transition-none",

  /** Topic / tag pills */
  pill:
    "inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1 text-[11px] font-medium text-foreground/80 transition-[border-color,color,transform,background-color] duration-200 ease-out hover:border-primary/30 hover:bg-primary/5 hover:text-primary active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:px-3 sm:py-1 sm:text-[12px]",

  /** Search field wrapper */
  searchShell:
    "rounded-xl border border-border/55 bg-background/90 shadow-sm transition-[box-shadow,border-color] duration-200 ease-out focus-within:border-primary/30 focus-within:shadow-lg focus-within:shadow-primary/8 focus-within:ring-2 focus-within:ring-primary/12",

  /** FAQ item container */
  faqItem:
    "rounded-xl border bg-card px-4 shadow-sm shadow-black/[0.03] transition-[border-color,box-shadow,transform] duration-200 ease-out sm:px-5 dark:shadow-black/20 motion-reduce:transition-none",

  /** Empty state panel */
  emptyState:
    "rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-[14px] text-muted-foreground",

  /** Section entrance (CSS animation, hero only) */
  heroEnter:
    "animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both motion-reduce:animate-none",

  /** Status banner entrance */
  bannerEnter:
    "animate-in fade-in slide-in-from-top-1 duration-300 fill-mode-both motion-reduce:animate-none",
} as const;
