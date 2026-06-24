"use client";

import { useState } from "react";
import { deleteUser } from "@/actions/admin";
import type { User } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  entityLabel?: string;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  entityLabel = "مستخدم",
}: DeleteUserDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user) return;

    setIsDeleting(true);

    try {
      const result = await deleteUser(user.id);

      if (result.success) {
        toast.success(result.message || "اتمسح المستخدم");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || "تعذّر الحذف المستخدم");
      }
    } catch (error: any) {
      toast.error(error.message || "حصل خطأ مش متوقع");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>متأكد؟</AlertDialogTitle>
          <AlertDialogDescription>
            مش هينفع الرجوع عن هذا الإجراء. سياتمسح حساب {entityLabel} الخاص
            بـ <strong>{user?.name}</strong> ({user?.email}) نهائيًا وإزالة
            بياناته من النظام.
            <br />
            <br />
            ملاحظة: التذاكر والتعليقات اللي عملها {entityLabel} ده هتفضل محفوظة عشان سلامة البيانات.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                جاري الحذف...
              </>
            ) : (
              `حذف ${entityLabel}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
