"use client";

import { useId, useState } from "react";
import PhoneInput, {
  isValidPhoneNumber,
  type Country,
  type Value,
} from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";
import { Phone } from "lucide-react";

import { Label } from "@/components/ui/label";
import { PhoneCountrySelect } from "@/components/shared/phone-country-select";
import {
  DEFAULT_PHONE_COUNTRY,
  formatPhoneDisplay,
} from "@/lib/phone/international-phone";
import { cn } from "@/lib/utils";

import "react-phone-number-input/style.css";

interface InternationalPhoneFieldProps {
  id?: string;
  value?: Value;
  onChange: (value: Value | undefined) => void;
  onNormalizedChange?: (normalized: string | null) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
  onErrorChange?: (error: string | null) => void;
  className?: string;
  showHint?: boolean;
  label?: string;
  defaultCountry?: Country;
}

function validateValue(value: Value | undefined, required: boolean): string | null {
  if (!value) {
    return required ? "رقم الهاتف مطلوب" : null;
  }
  if (!isValidPhoneNumber(value)) {
    return "أدخل رقم هاتف صالح للدولة المحددة";
  }
  return null;
}

export function InternationalPhoneField({
  id: idProp,
  value,
  onChange,
  onNormalizedChange,
  disabled = false,
  required = true,
  error: externalError,
  onErrorChange,
  className,
  showHint = true,
  label = "رقم الهاتف",
  defaultCountry = DEFAULT_PHONE_COUNTRY,
}: InternationalPhoneFieldProps) {
  const autoId = useId();
  const id = idProp || autoId;
  const [internalError, setInternalError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const error = externalError ?? (touched ? internalError : null);

  const applyChange = (next: Value | undefined) => {
    onChange(next);

    const validationError = validateValue(next, required);
    setInternalError(validationError);
    onErrorChange?.(validationError);

    if (next && isValidPhoneNumber(next)) {
      onNormalizedChange?.(next);
    } else {
      onNormalizedChange?.(null);
    }
  };

  const preview =
    value && isValidPhoneNumber(value) ? formatPhoneDisplay(value) : null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-medium text-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-primary" />
          {label}
          {required && <span className="text-destructive"> *</span>}
        </span>
      </Label>

      <PhoneInput
        id={id}
        international
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry}
        labels={en}
        value={value}
        onChange={applyChange}
        onBlur={() => setTouched(true)}
        disabled={disabled}
        dir="ltr"
        countrySelectComponent={PhoneCountrySelect}
        className={cn(
          "phone-input-root",
          error && "phone-input-root--invalid"
        )}
        numberInputProps={{
          className: "phone-input-field",
          placeholder: "Enter phone number",
        }}
      />

      {error ? (
        <p className="text-[11px] text-destructive">{error}</p>
      ) : preview ? (
        <p className="text-[11px] text-muted-foreground" dir="ltr">
          {preview}
        </p>
      ) : showHint ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          اختر الدولة وأدخل رقمك — يُحفظ بصيغة دولية ونستخدمه للتواصل عبر WhatsApp
        </p>
      ) : null}
    </div>
  );
}

