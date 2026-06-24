"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FAQItem } from "@/types/landing-page";
import { supportMotion } from "@/lib/home-motion";
import { Plus } from "lucide-react";

interface FAQAccordionProps {
  items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="mt-5 space-y-2.5">
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <Collapsible
            key={item.id}
            open={isOpen}
            onOpenChange={(nextOpen) => setOpenId(nextOpen ? item.id : null)}
          >
            <div
              className={cn(
                supportMotion.faqItem,
                isOpen
                  ? "border-primary/25 shadow-sm shadow-primary/5"
                  : "border-border/60 hover:border-border",
              )}
            >
              <CollapsibleTrigger
                className={cn(
                  "flex w-full items-center justify-between gap-3 py-3.5 text-start sm:gap-4 sm:py-4",
                  "rounded-lg transition-colors duration-200 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              >
                <span
                  className={cn(
                    "min-w-0 flex-1 text-[14px] font-semibold leading-snug transition-colors duration-200 sm:text-[15px]",
                    isOpen ? "text-foreground" : "text-foreground/90",
                  )}
                >
                  {item.question}
                </span>
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-[transform,background-color,border-color,color] duration-200 ease-out",
                    isOpen
                      ? "rotate-45 border-primary/30 bg-primary/10 text-primary"
                      : "border-border/60 bg-muted/50 text-muted-foreground",
                  )}
                  aria-hidden
                >
                  <Plus className="h-4 w-4" />
                </span>
              </CollapsibleTrigger>

              <CollapsibleContent className="support-collapsible-content overflow-hidden">
                <div className="pb-3.5 pe-2 text-[13px] leading-relaxed text-muted-foreground sm:pb-4 sm:pe-10 sm:text-[14px]">
                  {item.answer}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
