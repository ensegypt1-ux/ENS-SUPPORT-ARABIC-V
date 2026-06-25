"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Global Error Handler
 * Catches errors in the root layout and replaces the entire application UI
 * Must be a Client Component
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen bg-background text-foreground antialiased"
        style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
      >
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                حدث خطأ ما!
              </h1>
              <p className="text-muted-foreground">
                وقع خطأ حرج.  تحديث الصفحة والمحاولة مرة أخرى.
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground">
                  معرّف الخطأ: {error.digest}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => reset()}
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                إعادة المحاولة
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                الذهاب للصفحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
