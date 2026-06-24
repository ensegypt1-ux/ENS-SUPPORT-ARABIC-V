import {
  Settings,
  Mail,
  Upload,
  Shield,
  Ticket,
  Palette,
  Plug,
  Briefcase,
  Megaphone,
  KeyRound,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense } from "react";
import { getSettings } from "@/actions/settings";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllServices } from "@/actions/services";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import {
  adminTabsListClass,
  adminTabsScrollClass,
  adminTabTriggerClass,
} from "@/components/ui/arabic-ux";
import { EmailSettingsForm } from "@/components/settings/email-settings-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketSettingsForm } from "@/components/settings/ticket-settings-form";
import { AccessSettingsForm } from "@/components/settings/access-settings-form";
import { GeneralSettingsForm } from "@/components/settings/general-settings-form";
import { UpdatesSettingsForm } from "@/components/settings/updates-settings-form";
import { SecuritySettingsForm } from "@/components/settings/security-settings-form";
import { ServicesSettingsForm } from "@/components/settings/services-settings-form";
import { AppearanceSettingsForm } from "@/components/settings/appearance-settings-form";
import { FileUploadSettingsForm } from "@/components/settings/file-upload-settings-form";
import { IntegrationSettingsForm } from "@/components/settings/integration-settings-form";

// Force dynamic rendering for authenticated routes
export const dynamic = "force-dynamic";

const SETTINGS_TAB_ACTIVE_CLASS =
  "data-[state=active]:bg-[color-mix(in_oklab,var(--primary)_10%,white)]! data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:bg-primary/20! dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent";

const SETTINGS_TABS = [
  { value: "general", label: "عام", icon: Settings, iconClassName: "text-primary" },
  { value: "tickets", label: "التذاكر", icon: Ticket, iconClassName: "text-orange-500" },
  { value: "email", label: "البريد", icon: Mail, iconClassName: "text-blue-500" },
  { value: "files", label: "الملفات", icon: Upload, iconClassName: "text-purple-500" },
  { value: "security", label: "الأمان", icon: Shield, iconClassName: "text-green-500" },
  { value: "appearance", label: "المظهر", icon: Palette, iconClassName: "text-pink-500" },
  { value: "integrations", label: "التكاملات", icon: Plug, iconClassName: "text-cyan-500" },
  { value: "services", label: "الخدمات", icon: Briefcase, iconClassName: "text-emerald-500" },
  { value: "updates", label: "التحديثات", icon: Megaphone, iconClassName: "text-indigo-500" },
  { value: "access", label: "الوصول", icon: KeyRound, iconClassName: "text-violet-500" },
] as const;

export default async function SettingsPage() {
  const settingsResult = await getSettings();
  const servicesResult = await getAllServices();

  if (!settingsResult.success || !settingsResult.data) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>مقدرناش نحمّل الإعدادات</CardTitle>
            <CardDescription>
              {settingsResult.error || "مقدرناش نحمّل الإعدادات"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const settings = settingsResult.data;
  const services =
    servicesResult.success && servicesResult.data ? servicesResult.data : [];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <AdminPageHeader
        title="الإعدادات"
        description="اضبط إعدادات بوابة دعم ENS من مكان واحد."
      />

      <Tabs defaultValue="general" className="space-y-4">
        <div className={adminTabsScrollClass} dir="rtl">
          <TabsList
            className={`${adminTabsListClass} rounded-md bg-white`}
            dir="rtl"
          >
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  dir="ltr"
                  className={`${adminTabTriggerClass} rounded-md ${SETTINGS_TAB_ACTIVE_CLASS}`}
                >
                  <span className="hidden sm:inline" dir="rtl">
                    {tab.label}
                  </span>
                  <Icon className={`h-4 w-4 shrink-0 ${tab.iconClassName}`} />
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* General Settings */}
        <TabsContent value="general">
          <Suspense fallback={<SettingsSkeleton />}>
            <GeneralSettingsForm settings={settings} />
          </Suspense>
        </TabsContent>

        {/* Ticket Settings */}
        <TabsContent value="tickets">
          <Suspense fallback={<SettingsSkeleton />}>
            <TicketSettingsForm settings={settings} />
          </Suspense>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Suspense fallback={<SettingsSkeleton />}>
            <EmailSettingsForm settings={settings} />
          </Suspense>
        </TabsContent>

        {/* File Upload Settings */}
        <TabsContent value="files">
          <Suspense fallback={<SettingsSkeleton />}>
            <FileUploadSettingsForm settings={settings} />
          </Suspense>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Suspense fallback={<SettingsSkeleton />}>
            <SecuritySettingsForm settings={settings} />
          </Suspense>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Suspense fallback={<SettingsSkeleton />}>
            <AppearanceSettingsForm settings={settings} />
          </Suspense>
        </TabsContent>

        {/* Integration Settings */}
        <TabsContent value="integrations">
          <Suspense fallback={<SettingsSkeleton />}>
            <IntegrationSettingsForm settings={settings} />
          </Suspense>
        </TabsContent>

        <TabsContent value="services">
          <Suspense fallback={<SettingsSkeleton />}>
            <ServicesSettingsForm services={services} />
          </Suspense>
        </TabsContent>

        <TabsContent value="updates">
          <Suspense fallback={<SettingsSkeleton />}>
            <UpdatesSettingsForm settings={settings} />
          </Suspense>
        </TabsContent>

        <TabsContent value="access">
          <Suspense fallback={<SettingsSkeleton />}>
            <AccessSettingsForm />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}
