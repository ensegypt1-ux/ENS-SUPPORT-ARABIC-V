import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptySearchResultsProps {
  searchQuery?: string;
  entityName?: string;
  className?: string;
}

export function EmptySearchResults({
  searchQuery,
  entityName = "نتائج",
  className,
}: EmptySearchResultsProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div className="mb-4 rounded-full bg-muted p-3">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">مفيش {entityName}</h3>
      <p className="mt-1 max-w-sm text-muted-foreground">
        {searchQuery ? (
          <>
            مفيش {entityName} مطابق لـ{" "}
            <span className="font-medium text-foreground">
              &quot;{searchQuery}&quot;
            </span>
            . جرّب كلمة تانية.
          </>
        ) : (
          <>مفيش {entityName} مطابق للفلتر ده. غيّر الفلتر وجرب.</>
        )}
      </p>
    </div>
  );
}
