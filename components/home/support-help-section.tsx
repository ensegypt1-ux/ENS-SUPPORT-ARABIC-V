import Link from "next/link";
import { Mail } from "lucide-react";
import { ContactForm } from "@/components/home/contact-form";
import { FAQAccordion } from "@/components/home/faq-accordion";
import { HOME_COPY } from "@/lib/home-support-copy";
import { homeVisual } from "@/lib/home-visual";
import { supportMotion } from "@/lib/home-motion";
import { cn } from "@/lib/utils";
import type { FAQItem } from "@/types/landing-page";

interface SupportHelpSectionProps {
  faqItems: FAQItem[];
  openTicketHref?: string;
  supportEmail?: string;
}

export function SupportHelpSection({
  faqItems,
  openTicketHref = "/support/new",
  supportEmail,
}: SupportHelpSectionProps) {
  const hasFaq = faqItems.length > 0;

  return (
    <section
      id="contact"
      className={cn(homeVisual.sectionHelp, homeVisual.pageX)}
    >
      <div className={cn(homeVisual.container, homeVisual.helpGrid)}>
        {hasFaq ? (
          <div id="faq" className="scroll-mt-24 text-start">
            <p className={homeVisual.eyebrow}>
              <span className={homeVisual.eyebrowDot} aria-hidden />
              مساعدة سريعة
            </p>
            <h2 className={cn("mt-2.5 sm:mt-3", homeVisual.sectionTitle)}>
              {HOME_COPY.faq.title}
            </h2>
            <p className={homeVisual.sectionDesc}>
              لا تزال لم تجد إجابتك؟{" "}
              <Link
                href={openTicketHref}
                className={cn("font-semibold text-primary", supportMotion.textLink)}
              >
                {HOME_COPY.faq.openTicket}
              </Link>
            </p>
            <FAQAccordion items={faqItems} />
          </div>
        ) : null}

        <div className="text-start">
          <p className={homeVisual.eyebrow}>
            <span className={homeVisual.eyebrowDot} aria-hidden />
            تواصل مباشر
          </p>
          <h2 className={cn("mt-2.5 sm:mt-3", homeVisual.sectionTitle)}>
            {HOME_COPY.contact.title}
          </h2>
          <p className={homeVisual.sectionDesc}>{HOME_COPY.contact.description}</p>

          {supportEmail ? (
            <a
              href={`mailto:${supportEmail}`}
              className={cn(
                "mt-4 inline-flex max-w-full flex-wrap items-center gap-2 rounded-xl border border-border/55 bg-card px-3.5 py-2.5 text-[12px] font-medium text-primary shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-primary/25 hover:shadow-md sm:mt-5 sm:px-4 sm:text-[13px]",
                supportMotion.textLink,
              )}
              dir="ltr"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span dir="rtl">{HOME_COPY.contact.emailLabel}:</span>{" "}
              <span className="break-all">{supportEmail}</span>
            </a>
          ) : null}

          <div
            className={cn(
              homeVisual.surface,
              homeVisual.surfaceHover,
              "mt-5 p-4 sm:mt-6 sm:p-6 lg:p-7",
              "focus-within:border-primary/20 focus-within:shadow-md focus-within:shadow-primary/5 focus-within:ring-2 focus-within:ring-primary/10",
            )}
          >
            <h3 className="text-[15px] font-semibold text-foreground sm:text-[16px]">
              {HOME_COPY.contact.formTitle}
            </h3>
            <div className="mt-4 sm:mt-5">
              <ContactForm variant="compact" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
