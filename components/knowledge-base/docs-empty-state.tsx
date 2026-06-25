import Link from "next/link";
import { BookOpen, MessageCircleQuestion, Mail, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCS_COPY } from "@/lib/docs-copy";

export function DocsEmptyState() {
  return (
    <div
      className="flex flex-col items-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-14 text-center"
      dir="rtl"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <BookOpen className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-lg font-bold text-foreground">
        {DOCS_COPY.empty.title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {DOCS_COPY.empty.description}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <Button asChild className="h-10 rounded-xl">
          <Link href="/support/new">
            <Ticket className="ms-2 h-4 w-4" />
            {DOCS_COPY.empty.openTicket}
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-10 rounded-xl">
          <Link href="/#faq">
            <MessageCircleQuestion className="ms-2 h-4 w-4" />
            {DOCS_COPY.empty.faq}
          </Link>
        </Button>
        <Button asChild variant="ghost" className="h-10 rounded-xl">
          <Link href="/#contact">
            <Mail className="ms-2 h-4 w-4" />
            {DOCS_COPY.empty.contact}
          </Link>
        </Button>
      </div>
      <Link
        href="/"
        className="mt-6 text-xs font-medium text-primary hover:underline"
      >
        {DOCS_COPY.empty.home}
      </Link>
    </div>
  );
}
