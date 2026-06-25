"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import type { Value } from "react-phone-number-input";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InternationalPhoneField } from "@/components/shared/international-phone-field";
import { validateInternationalPhone } from "@/lib/phone/international-phone";

interface GuestTicketFormProps {
  visitorId: string;
  chatLogId?: string;
  defaultMessage?: string;
  departmentSlug?: string;
  onSubmitted: (ticketNumber: string) => void;
  onCancel: () => void;
}

export function GuestTicketForm({
  visitorId,
  chatLogId,
  defaultMessage = "",
  departmentSlug,
  onSubmitted,
  onCancel,
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
      className="widget-message-in space-y-4 rounded-2xl border border-border/55 bg-background p-4 shadow-sm ring-1 ring-border/30"
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold tracking-tight text-foreground">
          إرسال طلب دعم
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          رقم الهاتف ورسالتك فقط — سنتواصل معك عبر WhatsApp في أقرب وقت.
        </p>
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
            className="h-10 text-sm"
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
            className="h-10 text-sm"
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
          className="min-h-[96px] resize-none text-sm leading-relaxed"
          placeholder="صف مشكلتك أو استفسارك…"
          disabled={isLoading}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          size="sm"
          className="h-10 flex-1 rounded-xl text-sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Send className="me-1.5 h-4 w-4" />
          )}
          إرسال الطلب
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 rounded-xl"
          onClick={onCancel}
          disabled={isLoading}
        >
          إلغاء
        </Button>
      </div>
    </form>
  );
}
