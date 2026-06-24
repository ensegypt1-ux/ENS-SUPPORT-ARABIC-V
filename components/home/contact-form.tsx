"use client";

import { useState } from "react";
import { submitContact } from "@/actions/contact";
import { toast } from "sonner";
import { Loader2, Send, User, Mail, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supportMotion } from "@/lib/home-motion";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ContactFormProps {
  variant?: "default" | "compact";
}

export function ContactForm({ variant = "default" }: ContactFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error(" ملء جميع الحقول");
      return;
    }

    setIsLoading(true);
    try {
      const result = await submitContact(formData);
      if (result.success) {
        toast.success(result.message);
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("حصل خطأ مش متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "compact") {
    const fieldClass =
      "transition-[border-color,box-shadow,opacity] duration-200 focus-visible:border-primary/40";

    return (
      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
        <div className="grid grid-cols-1 gap-3.5 min-[520px]:grid-cols-2 sm:gap-4">
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="اسمك"
                className={cn("ps-10", fieldClass)}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="بريدك الإلكتروني"
                className={cn("ps-10", fieldClass)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="relative">
            <FileText className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="الموضوع"
              className={cn("ps-10", fieldClass)}
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="relative">
            <MessageSquare className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
            <Textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="رسالتك"
              className={cn("ps-10 min-h-[120px] resize-none", fieldClass)}
              disabled={isLoading}
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className={cn("w-full", supportMotion.button)}
        >
          {isLoading ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <Send className="me-2 h-4 w-4" />
              إرسال الرسالة
            </>
          )}
        </Button>
      </form>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">تواصل معنا</CardTitle>
        <CardDescription>
          هل لديك سؤال أو تحتاج مساعدة؟ املأ النموذج أدناه وسنعود إليك في أقرب وقت ممكن.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم</label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="محمد أحمد"
                  className="ps-10"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">الإيميل</label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="support@ens.eg"
                  className="ps-10"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">الموضوع</label>
            <div className="relative">
              <FileText className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="كيف يمكننا مساعدتك؟"
                className="ps-10"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">الرسالة</label>
            <div className="relative">
              <MessageSquare className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="أخبرنا المزيد عن استفسارك..."
                className="ps-10 min-h-[150px] resize-none"
                disabled={isLoading}
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                جاري إرسال الرسالة...
              </>
            ) : (
              <>
                <Send className="me-2 h-4 w-4" />
                إرسال الرسالة
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}