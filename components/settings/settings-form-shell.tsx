"use client";

import type { ReactNode } from "react";
import { Save } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PanelFormActions, PanelFormHeader } from "@/components/ui/panel-form";
import { LoadingButtonContent } from "@/components/ui/loading";
import { UI } from "@/lib/strings";

/** Settings card with physical RTL header and body. */
export function SettingsFormCard({
  icon,
  iconWrapperClassName,
  title,
  description,
  children,
  className,
  contentClassName,
}: {
  icon?: ReactNode;
  iconWrapperClassName?: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-md border-0 bg-gradient-to-br from-card to-card/80 p-0 shadow-lg",
        className
      )}
    >
      <CardHeader className="gap-0 border-b bg-white p-6 dark:bg-card" dir="rtl">
        <PanelFormHeader
          icon={icon}
          iconWrapperClassName={iconWrapperClassName}
          title={title}
          description={description}
        />
      </CardHeader>
      <CardContent
        className={cn("p-6 text-right", contentClassName)}
        dir="rtl"
      >
        {children}
      </CardContent>
    </Card>
  );
}

export function SettingsSaveBar({
  isLoading,
  label = "حفظ",
  type = "submit",
  onClick,
  secondary,
  className,
}: {
  isLoading: boolean;
  label?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  secondary?: ReactNode;
  className?: string;
}) {
  return (
    <PanelFormActions className={cn("py-6", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type={type}
          onClick={onClick}
          disabled={isLoading}
          className="h-11 gap-2 px-6 shadow-md transition-all hover:shadow-lg"
        >
          <LoadingButtonContent loading={isLoading} loadingLabel={UI.saving}>
            <>
              <span>{label}</span>
              <Save className="h-4 w-4" />
            </>
          </LoadingButtonContent>
        </Button>
        {secondary}
      </div>
    </PanelFormActions>
  );
}

export const settingsSectionTitleClass =
  "text-sm font-medium text-muted-foreground text-right";

export const settingsFieldClass = "space-y-2 text-right";

export const settingsInputClass =
  "h-11 bg-background/80 border-input/50 text-right focus:border-primary transition-colors";

export const settingsPanelClass = "rounded-xl border bg-muted/20 p-5";
