"use client";

import { useState } from "react";
import { Loader2, Send, Ticket } from "lucide-react";
import type { Value } from "react-phone-number-input";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InternationalPhoneField } from "@/components/shared/international-phone-field";
import { validateInternationalPhone } from "@/lib/phone/international-phone";
import {
  WidgetInlineNotice,
} from "@/components/ai-chat/widget-primitives";

interface GuestTicketFormProps {
  visitorId: string;
  chatLogId?: string;
  defaultMessage?: string;
  departmentSlug?: string;
  onSubmitted: (ticketNumber: string) => void;
  onCancel: () => void;
  primaryColor?: string;
}

export function GuestTicketForm({
  visitorId,
  chatLogId,
  defaultMessage = "",
  departmentSlug,
  onSubmitted,
  onCancel,
  primaryColor,
}: GuestTicketFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState<Value>();
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(defaultMessage);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const phoneResult = validateInternationalPhone(phone || "");
    if (!phoneResult.ok) {
      setPhoneError(phoneResult.error);
      return;
    }

    if (message.trim().length < 5) {
      setError("اكتب رسالة من 5 أحرف على الأقل.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/chat/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "زائر",
          phone: phoneResult.normalized,
          email: email.trim() || undefined,
          message: message.trim(),
          visitorId,
          chatLogId,
          departmentSlug,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "تعذّر إرسال التذكرة");
        return;
      }
      onSubmitted(data.data.ticketNumber);
    } catch {
      setError("خطأ في الشبكة — حاول مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="widget-panel-in space-y-4 rounded-[18px] border border-border/45 bg-background p-4 shadow-[0_2px_12px_-6px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-white shadow-sm"
          style={{ backgroundColor: primaryColor || "var(--primary)" }}
        >
          <Ticket className="h-4 w-4" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-[14px] font-semibold tracking-tight text-foreground">
            إرسال طلب دعم
          </p>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            رقم الهاتف ورسالتك فقط — سنتواصل معك في أقرب وقت.
          </p>
        </div>
      </div>

      <InternationalPhoneField
        value={phone}
        onChange={setPhone}
        error={phoneError}
        onErrorChange={setPhoneError}
        disabled={isLoading}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="guest-name" className="text-xs font-medium">
            الاسم <span className="font-normal text-muted-foreground">(اختياري)</span>
          </Label>
          <Input
            id="guest-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 rounded-xl text-sm"
            placeholder="أحمد محمد"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guest-email" className="text-xs font-medium">
            البريد <span className="font-normal text-muted-foreground">(اختياري)</span>
          </Label>
          <Input
            id="guest-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 rounded-xl text-sm"
            placeholder="you@email.com"
            disabled={isLoading}
            dir="ltr"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guest-message" className="text-xs font-medium">
          كيف يمكننا مساعدتك؟ <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="guest-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="min-h-[96px] resize-none rounded-xl text-sm leading-relaxed"
          placeholder="صف مشكلتك أو استفسارك…"
          disabled={isLoading}
        />
      </div>

      {error && <WidgetInlineNotice tone="error">{error}</WidgetInlineNotice>}

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          size="sm"
          className="h-11 flex-1 rounded-[14px] text-sm font-semibold"
          style={primaryColor ? { backgroundColor: primaryColor } : undefined}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Send className="me-1.5 h-4 w-4 rtl:-scale-x-100" />
          )}
          إرسال الطلب
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 rounded-[14px]"
          onClick={onCancel}
          disabled={isLoading}
        >
          إلغاء
        </Button>
      </div>
    </form>
  );
}
