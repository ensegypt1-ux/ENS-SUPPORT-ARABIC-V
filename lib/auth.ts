import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { APIError } from "better-auth/api";
import { MongoClient, ObjectId } from "mongodb";

// MongoDB connection
const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri, { retryWrites: false });
const db = client.db(process.env.DATABASE_NAME || "support-app");

export const auth = betterAuth({
  database: mongodbAdapter(db),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: !process.env.SKIP_EMAIL_VERIFICATION,
    async sendResetPassword({ user, url }) {
      const { sendEmail } = await import("@/lib/email");
      await sendEmail({
        to: user.email,
        subject: "إعادة تعيين كلمة المرور",
        html: `
          <h1>إعادة تعيين كلمة المرور</h1>
          <p>اضغط على الرابط أدناه لتعيين كلمة مرور جديدة:</p>
          <a href="${url}">تعيين كلمة المرور</a>
          <p>إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذا البريد.</p>
        `,
      });
    },
  },

  session: {
    expiresIn: parseInt(process.env.SESSION_MAX_AGE || "604800"), // 7 days default
    updateAge: 86400, // Update session every 24 hours
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "customer",
        input: false, // Don't allow users to set this directly
      },
      country: {
        type: "string",
        required: false,
        input: true, // Allow users to set this during registration
      },
      status: {
        type: "string",
        required: false,
        // Account access status ("active" | "disabled" | "banned").
        // Managed by admins via server actions — never set by the user.
        input: false,
      },
    },
  },

  // Block disabled/banned accounts from creating a session (i.e. logging in).
  // Active sessions are additionally revoked when an admin disables/bans a
  // user, and getSession() treats disabled/banned users as logged-out.
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          try {
            const userId = (session as { userId?: string }).userId;
            if (!userId) return;
            const userDoc = await db.collection("user").findOne(
              ObjectId.isValid(userId)
                ? { $or: [{ id: userId }, { _id: new ObjectId(userId) }] }
                : { id: userId },
              { projection: { status: 1 } },
            );
            const status = (userDoc as { status?: string } | null)?.status;
            if (status === "disabled" || status === "banned") {
              throw new APIError("FORBIDDEN", {
                message:
                  status === "banned"
                    ? "تم حظر حسابك. تواصل مع فريق الدعم."
                    : "تم تعطيل حسابك. تواصل مع فريق الدعم.",
              });
            }
          } catch (err) {
            // Re-throw our own block; otherwise fail open so a transient DB
            // error can't lock every user out of signing in.
            if (err instanceof APIError) throw err;
            console.error("Session status check failed:", err);
          }
        },
      },
    },
  },

  // Note: MongoDB adapter uses _id as the primary key
  // The 'id' field is automatically created by better-auth and should match _id
  // If you have existing users without 'id' field, run: node --env-file=.env.local scripts/fix-user-ids.js

  // Email configuration (if email notifications are enabled)
  ...(process.env.EMAIL_NOTIFICATIONS_ENABLED === "true" && {
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        // Send verification email using nodemailer
        const { sendEmail } = await import("@/lib/email");
        await sendEmail({
          to: user.email,
          subject: "تأكيد البريد الإلكتروني",
          html: `
            <h1>مرحبًا بك في بوابة الدعم</h1>
            <p>يرجى تأكيد بريدك الإلكتروني بالضغط على الرابط أدناه:</p>
            <a href="${url}">تأكيد البريد الإلكتروني</a>
            <p>إذا لم تنشئ حسابًا، يمكنك تجاهل هذا البريد.</p>
          `,
        });
      },
    },
  }),
});

export type Session = typeof auth.$Infer.Session;

// Extended user type with custom fields
export type SessionUser = Session["user"] & {
  role: "customer" | "support" | "admin";
  country?: string;
};
