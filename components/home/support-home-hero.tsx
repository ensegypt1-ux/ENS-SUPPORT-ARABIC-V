"use client";

import Link from "next/link";
import { ArrowLeft, Ticket, UtensilsCrossed } from "lucide-react";
import { HOME_COPY } from "@/lib/home-support-copy";
import { homeVisual } from "@/lib/home-visual";
import { supportMotion } from "@/lib/home-motion";
import { SupportKbSearch } from "@/components/home/support-kb-search";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SupportHomeHeroProps {
  isLoggedIn: boolean;
  userName?: string | null;
  ticketsHref: string;
  ensMenuAnchorHref?: string;
}

export function SupportHomeHero({
  isLoggedIn,
  userName,
  ticketsHref,
  ensMenuAnchorHref = "#ensmenu-support",
}: SupportHomeHeroProps) {
  return (
    <section
      id="overview"
      className={cn(homeVisual.heroSection, homeVisual.pageX)}
    >
      <div aria-hidden className={homeVisual.heroGlow} />

      <div className={cn(homeVisual.container, homeVisual.heroInner)}>
        <div className={cn(homeVisual.heroPanel, supportMotion.heroEnter)}>
          <Logo
            width={140}
            height={44}
            className={homeVisual.brandMark}
            showFallbackText
          />

          <div className="mt-4 sm:mt-5">
            <p className={homeVisual.eyebrow}>
              <span className={homeVisual.eyebrowDot} aria-hidden />
              {HOME_COPY.hero.badge}
            </p>
          </div>

          <h1 className={homeVisual.heroTitle}>{HOME_COPY.hero.title}</h1>
          <p className={homeVisual.heroSubtitle}>{HOME_COPY.hero.subtitle}</p>

          <ol className={homeVisual.journeyRow}>
            {HOME_COPY.hero.journey.map((step, i) => (
              <li key={step} className="inline-flex items-center gap-1.5 sm:gap-2">
                {i > 0 ? (
                  <span aria-hidden className="hidden text-border/70 sm:inline">
                    ←
                  </span>
                ) : null}
                <span className={homeVisual.journeyStep}>
                  <span className={homeVisual.journeyNum}>{i + 1}</span>
                  {step}
                </span>
              </li>
            ))}
          </ol>

          <div className="mx-auto mt-6 max-w-none text-start sm:mt-7 lg:max-w-3xl">
            <label htmlFor="home-kb-search" className={homeVisual.fieldLabel}>
              {HOME_COPY.hero.searchLabel}
            </label>
            <SupportKbSearch id="home-kb-search" />
            <div className="mt-2.5 flex flex-wrap gap-1.5 sm:mt-3">
              {HOME_COPY.searchChips.map((chip) => (
                <Link
                  key={chip}
                  href={`/docs?q=${encodeURIComponent(chip)}`}
                  className={cn(
                    "bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground sm:px-3 sm:text-[12px]",
                    supportMotion.chip,
                  )}
                >
                  {chip}
                </Link>
              ))}
            </div>
          </div>

          <div className={homeVisual.ctaRow}>
            <Button
              asChild
              size="lg"
              className={cn(
                "group",
                homeVisual.ctaButton,
                homeVisual.primaryCta,
                supportMotion.button,
              )}
            >
              <Link href="/support/new">
                {isLoggedIn
                  ? HOME_COPY.hero.primaryCtaLoggedIn
                  : HOME_COPY.hero.primaryCta}
                <ArrowLeft className="h-4 w-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className={cn(
                homeVisual.ctaButton,
                homeVisual.secondaryCta,
                supportMotion.button,
              )}
            >
              <Link href={ticketsHref}>
                {isLoggedIn
                  ? HOME_COPY.hero.secondaryCta
                  : HOME_COPY.hero.secondaryCtaGuest}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className={cn(
                "group",
                homeVisual.ctaButton,
                homeVisual.ensMenuHeroCta,
                supportMotion.button,
              )}
            >
              <Link href={ensMenuAnchorHref}>
                <UtensilsCrossed className="h-4 w-4" />
                {HOME_COPY.hero.ensMenuCta}
              </Link>
            </Button>
          </div>

          {isLoggedIn && userName ? (
            <p className="mt-4 text-[13px] text-muted-foreground sm:mt-5 sm:text-[14px]">
              {HOME_COPY.hero.loggedInGreeting}،{" "}
              <span className="font-semibold text-foreground">
                {userName.split(" ")[0]}
              </span>
              {" — "}
              <Link
                href={ticketsHref}
                className={cn("font-semibold text-primary", supportMotion.textLink)}
              >
                {HOME_COPY.hero.secondaryCta}
              </Link>
            </p>
          ) : (
            <p className="mt-4 text-[12px] text-muted-foreground sm:mt-5 sm:text-[13px]">
              <Ticket className="mb-0.5 inline h-3.5 w-3.5 text-primary/70" aria-hidden />{" "}
              التذكرة بتتبعت بالإيميل — مش لازم حساب.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
