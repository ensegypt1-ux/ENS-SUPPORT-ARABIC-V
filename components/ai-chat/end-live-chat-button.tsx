"use client";

import { useState } from "react";
import { Loader2, PhoneOff } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface EndLiveChatButtonProps {
  onConfirm: () => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
  variant?: "header" | "panel";
  className?: string;
}

export function EndLiveChatButton({
  onConfirm,
  disabled = false,
  variant = "header",
  className,
}: EndLiveChatButtonProps) {
  const [open, setOpen] = useState(false);
  const [ending, setEnding] = useState(false);

  const handleConfirm = async () => {
    setEnding(true);
    try {
      const result = await onConfirm();
      if (result.success) {
        setOpen(false);
      }
    } finally {
      setEnding(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !ending && setOpen(next)}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          title="إنهاء المحادثة المباشرة"
          aria-label="إنهاء المحادثة المباشرة"
          className={cn(
            variant === "header"
              ? "flex h-8 shrink-0 items-center justify-center gap-1 rounded-full bg-white/12 px-2.5 text-[11px] font-semibold text-white transition-all duration-200 hover:bg-white/22 active:scale-95 disabled:opacity-50"
              : "flex w-full items-center justify-center gap-2 rounded-[14px] border border-destructive/20 bg-destructive/[0.06] px-3 py-2.5 text-[12px] font-semibold text-destructive transition-all duration-200 hover:border-destructive/30 hover:bg-destructive/10 active:scale-[0.985] disabled:opacity-50",
            className
          )}
        >
          <PhoneOff className={variant === "header" ? "h-3.5 w-3.5" : "h-4 w-4"} />
          {variant === "panel" ? "إنهاء المحادثة المباشرة" : "إنهاء"}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl" className="text-right">
        <AlertDialogHeader className="text-right sm:text-right">
          <AlertDialogTitle>إنهاء المحادثة المباشرة؟</AlertDialogTitle>
          <AlertDialogDescription className="text-start leading-relaxed">
            سيتم إغلاق محادثتك مع فريق الدعم. يمكنك متابعة الأسئلة العامة مع
            المساعد الذكي بعد ذلك. لن يتم حذف سجل المحادثة من جانب فريق الدعم.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
          <AlertDialogAction
            disabled={ending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {ending ? (
              <>
                <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
                جارٍ الإنهاء…
              </>
            ) : (
              "نعم، أنهِ المحادثة"
            )}
          </AlertDialogAction>
          <AlertDialogCancel disabled={ending}>متابعة المحادثة</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
