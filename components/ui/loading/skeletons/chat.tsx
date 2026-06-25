import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Inbox layout skeleton — matches MessagesClient grid. */
export function ChatInboxPageSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid h-[calc(100vh-theme(spacing.14)-2rem)] overflow-hidden rounded-xl border border-border/50 md:h-[calc(100vh-theme(spacing.14)-3rem)]",
        "grid-cols-1 lg:grid-cols-[minmax(240px,280px)_1fr]",
        className
      )}
    >
      <div className="flex flex-col border-e border-border/50 p-3">
        <Skeleton className="mb-3 h-8 w-full rounded-lg" />
        <Skeleton className="mb-3 h-8 w-full rounded-lg" />
        <div className="mb-3 flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-14 rounded-md" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="mb-1.5 h-14 w-full rounded-lg" />
        ))}
      </div>
      <div className="flex flex-col bg-muted/20">
        <div className="border-b border-border/50 p-3">
          <Skeleton className="h-10 w-48" />
        </div>
        <MessageThreadSkeleton className="flex-1 p-4" />
        <div className="border-t border-border/50 p-3">
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/** Conversation list initial load — used inside ConversationList. */
export function ConversationListSkeleton() {
  return (
    <div className="space-y-2.5">
      <Skeleton className="h-14 w-full rounded-lg" />
      <Skeleton className="h-8 w-full rounded-lg" />
      <div className="flex gap-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-14 rounded-md" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

/** Message thread initial load. */
export function MessageThreadSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn("mx-auto flex w-full max-w-2xl flex-col gap-4", className)}
      dir="rtl"
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "flex w-full gap-2",
            i % 2 === 0 ? "justify-end" : "justify-start"
          )}
        >
          {i % 2 !== 0 && (
            <Skeleton className="mt-5 h-8 w-8 shrink-0 rounded-full" />
          )}
          <div className={cn("space-y-1.5", i % 2 === 0 ? "w-2/5" : "w-1/2")}>
            <Skeleton className="h-3 w-16 rounded-md" />
            <Skeleton className="h-10 w-full rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Embed widget launcher while config loads. */
export function WidgetLauncherSkeleton() {
  return (
    <div className="fixed bottom-4 end-4">
      <Skeleton className="h-14 w-14 rounded-full" />
    </div>
  );
}

/** Auth card shell while Suspense resolves. */
export function AuthCardSkeleton() {
  return (
    <div className="w-full max-w-[26rem] space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-full max-w-xs" />
      </div>
      <div className="space-y-3 rounded-2xl border border-border/60 p-6 sm:p-8">
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

/** AI typing indicator — three subtle dots. */
export function ThinkingIndicator({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-muted-foreground", className)}
      aria-label="جاري الكتابة"
      role="status"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 w-1 animate-bounce rounded-full bg-current"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}
