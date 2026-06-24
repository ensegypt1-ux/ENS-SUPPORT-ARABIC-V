import Link from "next/link";
import { Clock3, ShieldCheck } from "lucide-react";
import { FooterSection } from "@/types/landing-page";
import { Logo } from "@/components/ui/logo";

interface PublicFooterProps {
  content?: FooterSection;
}

const linkColumns = [
  { key: "product", title: "التذاكر" },
  { key: "resources", title: "موارد الدعم" },
  { key: "company", title: "ENSMenu" },
  { key: "legal", title: "البوابة" },
] as const;

export function PublicFooter({ content }: PublicFooterProps) {
  if (!content) return null;

  return (
    <footer className="relative bg-linear-to-b from-transparent via-muted/20 to-muted/40 px-4 pb-6 pt-10 dark:via-muted/10 dark:to-muted/20 sm:px-6 sm:pb-8 sm:pt-12 lg:px-8">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent"
      />
      <div className="mx-auto w-full max-w-[36rem] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-8 sm:gap-y-10 md:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="inline-block">
              <Logo
                width={120}
                height={40}
                className="h-7 w-auto"
                showFallbackText
              />
            </Link>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              {content.tagline}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                بوابة عملاء آمنة
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
                <Clock3 className="h-3 w-3 text-primary" />
                خدمة ذاتية على مدار الساعة
              </span>
            </div>
          </div>

          {/* Links Columns */}
          {linkColumns.map((column) => (
            <div key={column.key}>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {column.title}
              </h4>
              <ul className="mt-4 space-y-2.5 text-[13px]">
                {content.links[column.key].map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.href}
                      className="font-medium text-foreground/70 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-5 text-center sm:mt-10 sm:flex-row sm:pt-6 sm:text-start">
          <p className="text-[12px] text-muted-foreground">
            {content.copyright}
          </p>
          <p className="text-[12px] font-semibold tracking-tight text-foreground/60">
            {content.brandName}
            <span className="text-primary"> {content.brandHighlight}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
