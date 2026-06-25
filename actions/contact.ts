"use server";

import { getCollection } from "@/lib/db";
import { z } from "zod";
import { ObjectId } from "mongodb";

const contactSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("اكتب بريد إلكتروني صحيح"),
  subject: z.string().min(5, "الموضوع يجب أن يكون 5 أحرف على الأقل"),
  message: z.string().min(10, "الرسالة يجب أن تكون 10 أحرف على الأقل"),
});

export interface ContactSubmission {
  _id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: string;
  updatedAt?: string;
}

export async function submitContact(formData: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  try {
    const validData = contactSchema.parse(formData);
    const collection = await getCollection("contact_submissions");

    const result = await collection.insertOne({
      ...validData,
      status: "new",
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: "شكراً لرسالتك! سنتواصل معك قريباً.",
      id: result.insertedId.toString(),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues[0].message };
    }
    console.error("Contact submission error:", error);
    return {
      success: false,
      message: "حدث خطأ. أعد المحاولة.",
    };
  }
}

export async function getContactSubmissions() {
  const collection = await getCollection("contact_submissions");
  const submissions = await collection.find({}).sort({ createdAt: -1 }).toArray();
  return submissions.map((sub: Record<string, unknown>) => ({
    ...sub,
    _id: (sub._id as ObjectId)?.toString(),
  })) as ContactSubmission[];
}

export async function getContactSubmissionById(id: string) {
  const collection = await getCollection("contact_submissions");
  const submission = await collection.findOne({ _id: new ObjectId(id) } as Record<string, unknown>);
  if (submission) {
    return {
      ...submission,
      _id: (submission._id as ObjectId)?.toString(),
    } as ContactSubmission;
  }
  return null;
}

export async function updateContactStatus(
  id: string,
  status: ContactSubmission["status"]
) {
  try {
    const collection = await getCollection("contact_submissions");

    await collection.updateOne(
      { _id: new ObjectId(id) } as Record<string, unknown>,
      { $set: { status, updatedAt: new Date().toISOString() } }
    );

    return { success: true, message: "الحالة اتحدّت" };
  } catch (error) {
    console.error("Update contact status error:", error);
    return { success: false, message: "تعذّر تحديث الحالة" };
  }
}

export async function deleteContactSubmission(id: string) {
  try {
    const collection = await getCollection("contact_submissions");

    await collection.deleteOne({ _id: new ObjectId(id) } as Record<string, unknown>);

    return { success: true, message: "الإرسال تم الحذف" };
  } catch (error) {
    console.error("Delete contact submission error:", error);
    return { success: false, message: "تعذّر حذف الإرسال" };
  }
}