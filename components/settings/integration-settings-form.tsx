"use client";



import { useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";

import {

  Card,

  CardContent,

  CardHeader,

} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Switch } from "@/components/ui/switch";

import { toast } from "sonner";

import {

  testDiscordIntegration,

  testSlackIntegration,

  updateSettings,

} from "@/actions/settings";

import { SystemSettings } from "@/types/settings";

import { Loader2, Send, ShoppingCart } from "lucide-react";

import { SiSlack, SiDiscord, SiWhatsapp } from "react-icons/si";

import { Textarea } from "@/components/ui/textarea";

import {

  PanelSectionHeader,

  PanelSwitchField,

} from "@/components/ui/panel-form";

import {

  SettingsSaveBar,

  settingsFieldClass,

  settingsInputClass,

} from "@/components/settings/settings-form-shell";



const integrationSettingsSchema = z

  .object({

    envato: z.object({

      enabled: z.boolean(),

      apiToken: z.string().optional(),

      username: z.string().optional(),

    }),

    slack: z.object({

      enabled: z.boolean(),

      webhookUrl: z

        .string()

        .url("رابط webhook غير صالح")

        .optional()

        .or(z.literal("")),

      notifyOnNewTicket: z.boolean(),

    }),

    discord: z.object({

      enabled: z.boolean(),

      webhookUrl: z

        .string()

        .url("رابط webhook غير صالح")

        .optional()

        .or(z.literal("")),

      notifyOnNewTicket: z.boolean(),

    }),

    whatsapp: z.object({

      enabled: z.boolean(),

      phoneNumber: z.string().optional(),

      defaultMessage: z.string().optional(),

    }),

  });



type IntegrationSettingsFormData = z.infer<typeof integrationSettingsSchema>;



interface IntegrationSettingsFormProps {

  settings: SystemSettings;

}



export function IntegrationSettingsForm({

  settings,

}: IntegrationSettingsFormProps) {

  const [isLoading, setIsLoading] = useState(false);

  const [isTestingSlack, setIsTestingSlack] = useState(false);

  const [isTestingDiscord, setIsTestingDiscord] = useState(false);



  const {

    register,

    handleSubmit,

    formState: { errors },

    setValue,

    watch,

  } = useForm<IntegrationSettingsFormData>({

    resolver: zodResolver(integrationSettingsSchema),

    defaultValues: {

      envato: {

        enabled: settings.integrations.envato.enabled,

        apiToken: settings.integrations.envato.apiToken || "",

        username: settings.integrations.envato.username || "",

      },

      slack: {

        enabled: settings.integrations.slack.enabled,

        webhookUrl: settings.integrations.slack.webhookUrl || "",

        notifyOnNewTicket: settings.integrations.slack.notifyOnNewTicket,

      },

      discord: {

        enabled: settings.integrations.discord.enabled,

        webhookUrl: settings.integrations.discord.webhookUrl || "",

        notifyOnNewTicket: settings.integrations.discord.notifyOnNewTicket,

      },

      whatsapp: {

        enabled: settings.integrations.whatsapp?.enabled ?? false,

        phoneNumber: settings.integrations.whatsapp?.phoneNumber || "",

        defaultMessage:

          settings.integrations.whatsapp?.defaultMessage ||

          "مرحباً! لدي سؤال حول منتجاتكم.",

      },

    },

  });



  const envatoEnabled = watch("envato.enabled");

  const slackEnabled = watch("slack.enabled");

  const discordEnabled = watch("discord.enabled");

  const whatsappEnabled = watch("whatsapp.enabled");

  const slackWebhookUrl = watch("slack.webhookUrl");

  const discordWebhookUrl = watch("discord.webhookUrl");



  const onSubmit = async (data: IntegrationSettingsFormData) => {

    setIsLoading(true);



    try {

      const result = await updateSettings({

        integrations: {

          envato: {

            ...data.envato,

            apiToken: data.envato.apiToken || undefined,

            username: data.envato.username || undefined,

          },

          slack: {

            ...data.slack,

            webhookUrl: data.slack.webhookUrl || undefined,

          },

          discord: {

            ...data.discord,

            webhookUrl: data.discord.webhookUrl || undefined,

          },

          whatsapp: {

            ...data.whatsapp,

            phoneNumber: data.whatsapp.phoneNumber || undefined,

            defaultMessage: data.whatsapp.defaultMessage || undefined,

          },

        },

      });



      if (result.success) {

        toast.success("تم تحديث إعدادات التكامل");

      } else {

        toast.error(result.error || "تعذّر تحديث الإعدادات");

      }

    } catch {

      toast.error("حدث خطأ وإحنا بنحدّث الإعدادات");

    } finally {

      setIsLoading(false);

    }

  };



  const handleTestSlack = async () => {

    setIsTestingSlack(true);



    try {

      const result = await testSlackIntegration();



      if (result.success) {

        toast.success("تم الإرسال رسالة الاختبار على Slack");

      } else {

        toast.error(result.error || "تعذّر الإرسال رسالة الاختبار");

      }

    } catch {

      toast.error("حدث خطأ في اختبار Slack");

    } finally {

      setIsTestingSlack(false);

    }

  };



  const handleTestDiscord = async () => {

    setIsTestingDiscord(true);



    try {

      const result = await testDiscordIntegration();



      if (result.success) {

        toast.success("تم الإرسال رسالة الاختبار على Discord");

      } else {

        toast.error(result.error || "تعذّر الإرسال رسالة الاختبار");

      }

    } catch {

      toast.error("حدث خطأ في اختبار Discord");

    } finally {

      setIsTestingDiscord(false);

    }

  };



  return (

    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Envato Integration */}

      <Card className="overflow-hidden rounded-md border-0 bg-gradient-to-br from-card to-card/80 p-0 shadow-lg">

        <CardHeader className="gap-0 border-b bg-white p-6 dark:bg-card" dir="rtl">

          <PanelSectionHeader

            title="تكامل Envato / CodeCanyon"

            description="التحقق من رموز الشراء من Envato/CodeCanyon"

            icon={

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">

                <ShoppingCart className="h-5 w-5 text-emerald-500" />

              </div>

            }

            actions={

              <Switch

                id="envato.enabled"

                checked={envatoEnabled}

                onCheckedChange={(checked) =>

                  setValue("envato.enabled", checked)

                }

              />

            }

          />

        </CardHeader>

        <CardContent className="space-y-4 pb-6 text-right" dir="rtl">

          <div className={settingsFieldClass}>

            <Label htmlFor="envato.apiToken">رمز Envato API</Label>

            <Input

              id="envato.apiToken"

              type="password"

              {...register("envato.apiToken")}

              placeholder="رمز Envato API الخاص بك"

              disabled={!envatoEnabled}

              className={settingsInputClass}

            />

            <p className="text-sm text-muted-foreground">

              احصل على رمز API من{" "}

              <a

                href="https://build.envato.com/create-token/"

                target="_blank"

                rel="noopener noreferrer"

                className="text-primary hover:underline"

              >

                Envato API

              </a>

            </p>

            {errors.envato?.apiToken && (

              <p className="text-sm text-destructive">

                {errors.envato.apiToken.message}

              </p>

            )}

          </div>



          <div className={settingsFieldClass}>

            <Label htmlFor="envato.username">اسم مستخدم Envato</Label>

            <Input

              id="envato.username"

              {...register("envato.username")}

              placeholder="your_envato_username"

              disabled={!envatoEnabled}

              dir="ltr"

              className={settingsInputClass}

            />

            {errors.envato?.username && (

              <p className="text-sm text-destructive">

                {errors.envato.username.message}

              </p>

            )}

          </div>

        </CardContent>

      </Card>



      {/* Slack Integration */}

      <Card className="overflow-hidden rounded-md border-0 bg-gradient-to-br from-card to-card/80 p-0 shadow-lg">

        <CardHeader className="gap-0 border-b bg-white p-6 dark:bg-card" dir="rtl">

          <PanelSectionHeader

            title="تكامل Slack"

            description="إرسال إشعارات إلى Slack عند إنشاء التذاكر"

            icon={

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4A154B]/10">

                <SiSlack className="h-5 w-5 text-[#4A154B]" />

              </div>

            }

            actions={

              <Switch

                id="slack.enabled"

                checked={slackEnabled}

                onCheckedChange={(checked) =>

                  setValue("slack.enabled", checked)

                }

              />

            }

          />

        </CardHeader>

        <CardContent className="space-y-4 pb-6 text-right" dir="rtl">

          <div className={settingsFieldClass}>

            <Label htmlFor="slack.webhookUrl">رابط Slack Webhook</Label>

            <Input

              id="slack.webhookUrl"

              type="url"

              {...register("slack.webhookUrl")}

              placeholder="https://hooks.slack.com/services/..."

              disabled={!slackEnabled}

              dir="ltr"

              className={settingsInputClass}

            />

            <p className="text-sm text-muted-foreground">

              أنشئ webhook في إعدادات مساحة عمل Slack

            </p>

            {errors.slack?.webhookUrl && (

              <p className="text-sm text-destructive">

                {errors.slack.webhookUrl.message}

              </p>

            )}

          </div>



          <PanelSwitchField

            label="إشعار عند تذكرة جديدة"

            description="إرسال رسالة عند افتح تذكرة جديدة"

            control={

              <Switch

                id="slack.notifyOnNewTicket"

                checked={watch("slack.notifyOnNewTicket")}

                onCheckedChange={(checked) =>

                  setValue("slack.notifyOnNewTicket", checked)

                }

                disabled={!slackEnabled}

              />

            }

          />



          <Button

            type="button"

            variant="outline"

            onClick={handleTestSlack}

            disabled={isTestingSlack || !slackEnabled || !slackWebhookUrl}

            className="gap-2"

          >

            {isTestingSlack ? (

              <>

                <span>جاري الإرسال...</span>

                <Loader2 className="h-4 w-4 animate-spin" />

              </>

            ) : (

              <>

                <span>إرسال رسالة اختبار</span>

                <Send className="h-4 w-4" />

              </>

            )}

          </Button>

        </CardContent>

      </Card>



      {/* Discord Integration */}

      <Card className="overflow-hidden rounded-md border-0 bg-gradient-to-br from-card to-card/80 p-0 shadow-lg">

        <CardHeader className="gap-0 border-b bg-white p-6 dark:bg-card" dir="rtl">

          <PanelSectionHeader

            title="تكامل Discord"

            description="إرسال إشعارات إلى Discord عند إنشاء التذاكر"

            icon={

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5865F2]/10">

                <SiDiscord className="h-5 w-5 text-[#5865F2]" />

              </div>

            }

            actions={

              <Switch

                id="discord.enabled"

                checked={discordEnabled}

                onCheckedChange={(checked) =>

                  setValue("discord.enabled", checked)

                }

              />

            }

          />

        </CardHeader>

        <CardContent className="space-y-4 pb-6 text-right" dir="rtl">

          <div className={settingsFieldClass}>

            <Label htmlFor="discord.webhookUrl">رابط Discord Webhook</Label>

            <Input

              id="discord.webhookUrl"

              type="url"

              {...register("discord.webhookUrl")}

              placeholder="https://discord.com/api/webhooks/..."

              disabled={!discordEnabled}

              dir="ltr"

              className={settingsInputClass}

            />

            <p className="text-sm text-muted-foreground">

              أنشئ webhook في إعدادات خادم Discord

            </p>

            {errors.discord?.webhookUrl && (

              <p className="text-sm text-destructive">

                {errors.discord.webhookUrl.message}

              </p>

            )}

          </div>



          <PanelSwitchField

            label="إشعار عند تذكرة جديدة"

            description="إرسال رسالة عند افتح تذكرة جديدة"

            control={

              <Switch

                id="discord.notifyOnNewTicket"

                checked={watch("discord.notifyOnNewTicket")}

                onCheckedChange={(checked) =>

                  setValue("discord.notifyOnNewTicket", checked)

                }

                disabled={!discordEnabled}

              />

            }

          />



          <Button

            type="button"

            variant="outline"

            onClick={handleTestDiscord}

            disabled={isTestingDiscord || !discordEnabled || !discordWebhookUrl}

            className="gap-2"

          >

            {isTestingDiscord ? (

              <>

                <span>جاري الإرسال...</span>

                <Loader2 className="h-4 w-4 animate-spin" />

              </>

            ) : (

              <>

                <span>إرسال رسالة اختبار</span>

                <Send className="h-4 w-4" />

              </>

            )}

          </Button>

        </CardContent>

      </Card>



      {/* WhatsApp Integration */}

      <Card className="overflow-hidden rounded-md border-0 bg-gradient-to-br from-card to-card/80 p-0 shadow-lg">

        <CardHeader className="gap-0 border-b bg-white p-6 dark:bg-card" dir="rtl">

          <PanelSectionHeader

            title="دردشة WhatsApp"

            description="تفعيل زر دردشة WhatsApp لدعم العملاء"

            icon={

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">

                <SiWhatsapp className="h-5 w-5 text-green-500" />

              </div>

            }

            actions={

              <Switch

                id="whatsapp.enabled"

                checked={whatsappEnabled}

                onCheckedChange={(checked) =>

                  setValue("whatsapp.enabled", checked)

                }

              />

            }

          />

        </CardHeader>

        <CardContent className="space-y-4 pb-6 text-right" dir="rtl">

          <div className={settingsFieldClass}>

            <Label htmlFor="whatsapp.phoneNumber">رقم WhatsApp</Label>

            <Input

              id="whatsapp.phoneNumber"

              type="tel"

              {...register("whatsapp.phoneNumber")}

              placeholder="+1234567890 (مع رمز الدولة)"

              disabled={!whatsappEnabled}

              dir="ltr"

              className={settingsInputClass}

            />

            <p className="text-sm text-muted-foreground">

              أدخل رقم الهاتف مع رمز الدولة (مثال: +1234567890)

            </p>

            {errors.whatsapp?.phoneNumber && (

              <p className="text-sm text-destructive">

                {errors.whatsapp.phoneNumber.message}

              </p>

            )}

          </div>



          <div className={settingsFieldClass}>

            <Label htmlFor="whatsapp.defaultMessage">الرسالة الافتراضية</Label>

            <Textarea

              id="whatsapp.defaultMessage"

              {...register("whatsapp.defaultMessage")}

              placeholder="مرحباً! لدي سؤال حول منتجاتكم."

              disabled={!whatsappEnabled}

              rows={3}

            />

            <p className="text-sm text-muted-foreground">

              رسالة مُعبأة مسبقاً عند نقر العملاء على زر WhatsApp

            </p>

            {errors.whatsapp?.defaultMessage && (

              <p className="text-sm text-destructive">

                {errors.whatsapp.defaultMessage.message}

              </p>

            )}

          </div>

        </CardContent>

      </Card>



      <SettingsSaveBar

        isLoading={isLoading}

        label="حفظ جميع التكاملات"

        className="py-4"

      />

    </form>

  );

}


