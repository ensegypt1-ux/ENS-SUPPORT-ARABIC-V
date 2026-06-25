import { z } from "zod";

const emailMsg = "دخل البريد الإلكتروني صح";
const passwordMin6 = "كلمة المرور يجب أن تكون 6 حروف على الأقل";
const passwordMin8 = "كلمة المرور يجب أن تكون 8 حروف على الأقل";
const passwordComplex =
  "يجب أن يحتوي حرف كبير وحرف صغير ورقم";
const passwordMismatch = "كلمتا المرور غير متطابقين";
const nameMin2 = "الاسم يجب أن يكون حرفين على الأقل";

export const loginSchema = z.object({
  email: z.string().email(emailMsg),
  password: z.string().min(6, passwordMin6),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, nameMin2),
    email: z.string().email(emailMsg),
    country: z.string().min(1, "اختر الدولة"),
    password: z
      .string()
      .min(8, passwordMin8)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, passwordComplex),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: passwordMismatch,
    path: ["confirmPassword"],
  });

export const createUserSchema = z
  .object({
    name: z.string().min(2, nameMin2),
    email: z.string().email(emailMsg),
    password: z
      .string()
      .min(8, passwordMin8)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, passwordComplex),
    confirmPassword: z.string(),
    role: z.enum(["customer", "support", "admin"]),
    rbacRoleId: z.string().optional().or(z.literal("")),
    country: z.string().optional(),
    departmentSlugs: z.array(z.string().max(80)).max(20).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: passwordMismatch,
    path: ["confirmPassword"],
  })
  .refine(
    (data) =>
      data.role !== "support" ||
      (!!data.departmentSlugs && data.departmentSlugs.length > 0),
    {
      message: "اختر قسم واحد على الأقل",
      path: ["departmentSlugs"],
    }
  );

export const updateUserSchema = z
  .object({
    name: z.string().min(2, nameMin2),
    email: z.string().email(emailMsg),
    role: z.enum(["customer", "support", "admin"]),
    rbacRoleId: z.string().optional().or(z.literal("")),
    country: z.string().optional(),
    departmentSlugs: z.array(z.string().max(80)).max(20).optional(),
    password: z
      .string()
      .min(8, passwordMin8)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, passwordComplex)
      .optional()
      .or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: passwordMismatch,
      path: ["confirmPassword"],
    }
  )
  .refine(
    (data) =>
      data.role !== "support" ||
      (!!data.departmentSlugs && data.departmentSlugs.length > 0),
    {
      message: "اختر قسم واحد على الأقل",
      path: ["departmentSlugs"],
    }
  );

export const updateProfileSchema = z.object({
  name: z.string().min(2, nameMin2),
  email: z.string().email(emailMsg),
  phone: z
    .string()
    .min(7, "رقم التليفون قصير أوي")
    .max(20, "رقم التليفون طويل أوي")
    .regex(/^[+]?[\d\s\-()]+$/, "رقم التليفون غير صالح")
    .optional()
    .or(z.literal("")),
  envatoUsername: z
    .string()
    .min(3, "يوزر Envato يجب أن يكون 3 حروف على الأقل")
    .max(30, "يوزر Envato طويل أوي")
    .regex(/^[A-Za-z0-9_]+$/, "حروف وأرقام و _ بس")
    .optional()
    .or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  image: z.string().url("الرابط غير صالح").optional().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "اكتب كلمة المرور الحالية"),
    newPassword: z
      .string()
      .min(8, passwordMin8)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, passwordComplex),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: passwordMismatch,
    path: ["confirmPassword"],
  });

const purchaseCodeField = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const purchaseCodeRegex =
        /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
      return purchaseCodeRegex.test(val);
    },
    {
      message: "كود الشراء غير صالح. يجب أن يكون كود Envato (UUID).",
    }
  );

const commonRequestFields = {
  title: z
    .string()
    .min(5, "العنوان يجب أن يكون 5 حروف على الأقل")
    .max(200, "العنوان طويل أوي"),
  description: z
    .string()
    .min(20, "الوصف يجب أن يكون 20 حرف على الأقل")
    .max(5000, "الوصف طويل أوي"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  purchaseCode: purchaseCodeField,
  timezone: z.string().optional(),
};

const ticketBaseSchema = z.object({
  ...commonRequestFields,
  departmentSlug: z.string().max(50).optional().or(z.literal("")),
  productSlug: z.string().max(100).optional().or(z.literal("")),
  productName: z.string().optional(),
  productVersion: z.string().optional(),
});

export const createTicketSchema = ticketBaseSchema.extend({
  category: z
    .string()
    .min(1, "اختر النوع")
    .max(50, "النوع طويل أوي")
    .refine((val) => val !== "service", {
      message: "نوع غير صالح",
    }),
});

export const createPublicTicketSchema = createTicketSchema.extend({
  name: z.string().min(1, "الاسم مطلوب").max(100, "الاسم طويل أوي"),
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email(emailMsg)
    .max(200, "البريد الإلكتروني طويل أوي"),
});

export const guestCommentSchema = z.object({
  content: z
    .string()
    .min(1, "اكتب رسالة")
    .max(5000, "الرسالة طويلة أوي"),
});

export const createInstallationRequestSchema = ticketBaseSchema;

export const createCustomizationRequestSchema = ticketBaseSchema;

export const adminCreateTicketSchema = ticketBaseSchema.extend({
  customerId: z.string().min(1, "اختر العميل"),
  category: z
    .string()
    .min(1, "اختر النوع")
    .max(50, "النوع طويل أوي")
    .refine((val) => val !== "service", {
      message: "نوع غير صالح",
    }),
});

export const updateTicketSchema = z.object({
  status: z
    .enum([
      "open",
      "scheduled_meeting",
      "in_progress",
      "waiting_on_customer",
      "resolved",
      "closed",
    ])
    .optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedToId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateCustomizationSchema = z.object({
  title: z
    .string()
    .min(5, "العنوان يجب أن يكون 5 حروف على الأقل")
    .max(200, "العنوان طويل أوي"),
  description: z
    .string()
    .min(20, "الوصف يجب أن يكون 20 حرف على الأقل")
    .max(5000, "الوصف طويل أوي"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  productName: z.string().optional(),
  productVersion: z.string().optional(),
});

export const updateInstallationSchema = z.object({
  title: z
    .string()
    .min(5, "العنوان يجب أن يكون 5 حروف على الأقل")
    .max(200, "العنوان طويل أوي"),
  description: z
    .string()
    .min(20, "الوصف يجب أن يكون 20 حرف على الأقل")
    .max(5000, "الوصف طويل أوي"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  productName: z.string().optional(),
  productVersion: z.string().optional(),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "اكتب تعليق")
    .max(2000, "التعليق طويل أوي"),
  isInternal: z.boolean().optional().default(false),
  parentCommentId: z.string().optional(),
  attachmentIds: z.array(z.string()).optional(),
});

export const createMeetingSchema = z.object({
  platform: z.enum(["zoom", "google_meet"], {
    message: "اختر منصة الاجتماع",
  }),
  title: z
    .string()
    .min(3, "العنوان يجب أن يكون 3 حروف على الأقل")
    .max(200, "العنوان طويل أوي"),
  description: z.string().max(1000, "الوصف طويل أوي").optional(),
  scheduledAt: z.coerce.date(),
  duration: z
    .number()
    .min(15, "المدة 15 دقيقة على الأقل")
    .max(480, "المدة 8 ساعات كحد أقصى")
    .optional(),
  meetingLink: z.string().url("الرابط غير صالح").optional().or(z.literal("")),
  timezone: z.string().optional(),
});

export const updateMeetingSchema = z.object({
  platform: z.enum(["zoom", "google_meet"]).optional(),
  title: z
    .string()
    .min(3, "العنوان يجب أن يكون 3 حروف على الأقل")
    .max(200, "العنوان طويل أوي")
    .optional(),
  description: z.string().max(1000, "الوصف طويل أوي").optional(),
  scheduledAt: z.coerce.date().optional(),
  duration: z
    .number()
    .min(15, "المدة 15 دقيقة على الأقل")
    .max(480, "المدة 8 ساعات كحد أقصى")
    .optional(),
  meetingLink: z.string().url("الرابط غير صالح").optional().or(z.literal("")),
  timezone: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
  cancellationReason: z.string().max(500).optional(),
});

export const ticketFiltersSchema = z.object({
  status: z
    .union([
      z.enum([
        "open",
        "scheduled_meeting",
        "in_progress",
        "waiting_on_customer",
        "resolved",
        "closed",
      ]),
      z.array(
        z.enum([
          "open",
          "scheduled_meeting",
          "in_progress",
          "waiting_on_customer",
          "resolved",
          "closed",
        ])
      ),
    ])
    .optional(),
  priority: z
    .union([
      z.enum(["low", "medium", "high", "urgent"]),
      z.array(z.enum(["low", "medium", "high", "urgent"])),
    ])
    .optional(),
  category: z
    .union([
      z.enum([
        "bug",
        "feature_request",
        "technical_support",
        "account",
        "general",
      ]),
      z.array(
        z.enum([
          "bug",
          "feature_request",
          "technical_support",
          "account",
          "general",
        ])
      ),
    ])
    .optional(),
  assignedToId: z.string().optional(),
  customerId: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
