/**
 * Egyptian Arabic UI copy — natural, product-friendly, consistent.
 * Use for toasts, errors, empty states, and shared messages.
 */

export const COPY = {
  errors: {
    generic: "حصل خطأ",
    unexpected: "حصل خطأ مش متوقع",
    loadFailed: "تعذّر التحميل",
    saveFailed: "تعذّر الحفظ",
    updateFailed: "تعذّر التحديث",
    deleteFailed: "تعذّر الحذف",
    createFailed: "تعذّر الإنشاء",
    sendFailed: "تعذّر الإرسال",
    unauthorized: "مش مسموحلك",
    notFound: "مش موجود",
    network: "اتأكد من الاتصال بالإنترنت وحاول تاني",
  },
  success: {
    saved: "اتحفظ",
    updated: "اتحدّث",
    deleted: "اتمسح",
    created: "اتعمل",
    sent: "اتبعت",
  },
  empty: {
    noResults: "مفيش نتائج",
    noSearchMatch: (entity: string, query?: string) =>
      query
        ? `مفيش ${entity} مطابق لـ «${query}». جرّب كلمة تانية.`
        : `مفيش ${entity} مطابق للفلتر ده. غيّر الفلتر وجرب.`,
    noItems: (entity: string) => `مفيش ${entity} لسه`,
  },
  loading: {
    default: "بيحمّل...",
    saving: "بيتحفظ...",
    sending: "بيتبعت...",
  },
  confirm: {
    delete: "متأكد إنك عايز تمسح ده؟",
    unsaved: "فيه تغييرات مش متحفظة. عايز تكمل؟",
  },
} as const;
