"use client";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef } from "react";
import {
  updateProfile,
  uploadProfileAvatar,
  changePassword,
} from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UpdateProfileFormData, ChangePasswordFormData } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations";
import { CountryCombobox } from "@/components/ui/country-combobox";
import { AR_LOCALE } from "@/lib/strings";

const ROLE_LABELS: Record<string, string> = {
  customer: "عميل",
  support: "دعم",
  admin: "مدير",
};

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Loader2,
  Upload,
  Pencil,
  KeyRound,
  Calendar,
} from "lucide-react";

interface ProfileFormProps {
  initialData: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    envatoUsername?: string;
    country?: string;
    image?: string;
    role: string;
    createdAt: string; // ISO string
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    initialData.image
  );

  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: initialData.name || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      envatoUsername: initialData.envatoUsername || "",
      country: initialData.country || "",
      image: initialData.image || "",
    },
    mode: "onChange",
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const onSubmit = async (values: UpdateProfileFormData) => {
    setIsSaving(true);
    try {
      const res = await updateProfile(values);
      if (res.success) {
        toast.success(res.message || "اتحدّث الملف الشخصي");
        router.refresh();
      } else {
        toast.error(res.error || "تعذّر التحديث الملف الشخصي");
      }
    } catch {
      toast.error("حصل خطأ مش متوقع أثناء تحديث الملف الشخصي");
    } finally {
      setIsSaving(false);
    }
  };
  const onSubmitPassword = async (values: ChangePasswordFormData) => {
    setIsChangingPassword(true);
    try {
      const res = await changePassword(values);
      if (res.success) {
        toast.success(res.message || "اتحدّث كلمة المرور");
        passwordForm.reset();
      } else {
        toast.error(res.error || "تعذّر التحديث كلمة المرور");
      }
    } catch {
      toast.error("حصل خطأ مش متوقع أثناء تحديث كلمة المرور");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadProfileAvatar(fd);
      if (res.success) {
        toast.success(res.message || "اتحدّث الصورة الرمزية");
        if (res.data?.url) {
          setImageUrl(res.data.url);
          form.setValue("image", res.data.url);
          // Broadcast to header/sidebar to update instantly without waiting for SSR refresh
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("app:avatar-updated", {
                detail: { url: res.data.url },
              })
            );
          }
        }
        router.refresh();
      } else {
        toast.error(res.error || "تعذّر رفع الصورة الرمزية");
      }
    } catch {
      toast.error("حصل خطأ مش متوقع أثناء رفع الصورة الرمزية");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border/60">
          {/* Left: Avatar Section */}
          <div className="p-6 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-transparent">
            <div className="relative group">
              <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
                {imageUrl ? (
                  <AvatarImage src={imageUrl} alt={initialData.name} />
                ) : (
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {getInitials(initialData.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-1 -end-1 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all group-hover:scale-105"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </div>
            <div className="mt-4 text-center">
              <h3 className="font-semibold text-foreground">
                {initialData.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {initialData.email}
              </p>
              <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                {ROLE_LABELS[initialData.role] ?? initialData.role}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                انضم في{" "}
                {new Date(initialData.createdAt).toLocaleDateString(AR_LOCALE)}
              </span>
            </div>
          </div>

          {/* Right: Edit Form */}
          <div className="lg:col-span-2 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Pencil className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-foreground">تعديل الملف الشخصي</h3>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                          الاسم الكامل
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="اسمك"
                            className="bg-background/50 border-border/60 focus:border-primary/50 transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                          الإيميل
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            className="bg-background/50 border-border/60 focus:border-primary/50 transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                          الدولة
                        </FormLabel>
                        <FormControl>
                          <CountryCombobox
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="اختر دولتك"
                            className="bg-background/50 border-border/60 focus:border-primary/50 transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                          رقم الهاتف
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+1 555 123 4567"
                            className="bg-background/50 border-border/60 focus:border-primary/50 transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="envatoUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                        اسم مستخدم Envato
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="your_envato_username"
                          className="bg-background/50 border-border/60 focus:border-primary/50 transition-colors"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-lg w-full sm:w-auto"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      "حفظ التغييرات"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => form.reset()}
                    disabled={isSaving}
                    className="text-muted-foreground w-full sm:w-auto"
                  >
                    إعادة التعيين
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>

      {/* Security Card */}
      <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <KeyRound className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-medium text-foreground">الأمان</h3>
        </div>

        <Form {...passwordForm}>
          <form
            onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
            className="space-y-5"
          >
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    كلمة المرور الحالية
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-background/50 border-border/60 focus:border-primary/50 transition-colors max-w-md"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      كلمة المرور الجديدة
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="أدخل كلمة المرور الجديدة"
                        className="bg-background/50 border-border/60 focus:border-primary/50 transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      تأكيد كلمة المرور
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="أكّد كلمة المرور الجديدة"
                        className="bg-background/50 border-border/60 focus:border-primary/50 transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="rounded-lg w-full sm:w-auto"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    جاري التحديث...
                  </>
                ) : (
                  "تحديث كلمة المرور"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => passwordForm.reset()}
                disabled={isChangingPassword}
                className="text-muted-foreground w-full sm:w-auto"
              >
                إعادة التعيين
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
