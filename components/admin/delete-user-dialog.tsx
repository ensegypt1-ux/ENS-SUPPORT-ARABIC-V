"use client";

import { useRef, useState } from "react";
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
  /** Called immediately after a successful delete, before navigation/refresh. */
  onDeleted?: (userId: string) => void;
  /** Navigate away before refresh (e.g. detail pages). Uses replace, not push. */
  redirectTo?: string;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  entityLabel = "مستخدم",
  onDeleted,
  redirectTo,
}: DeleteUserDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const deletingRef = useRef(false);

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!user || isDeleting || deletingRef.current) return;

    deletingRef.current = true;
    setIsDeleting(true);

    const deletedUserId = user.id;

    try {
      const result = await deleteUser(deletedUserId);

      if (result.success) {
        toast.success(result.message || "تم الحذف المستخدم");
        onOpenChange(false);
        onDeleted?.(deletedUserId);
        if (redirectTo) {
          router.replace(redirectTo);
        }
        router.refresh();
      } else {
        toast.error(result.error || "تعذّر الحذف المستخدم");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "حدث خطأ غير متوقع",
      );
    } finally {
      deletingRef.current = false;
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isDeleting) return;
        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>متأكد؟</AlertDialogTitle>
          <AlertDialogDescription>
            لا يمكن التراجع عن هذا الإجراء. سيتم الحذف حساب {entityLabel} الخاص
            بـ <strong>{user?.name}</strong> ({user?.email}) نهائيًا وإزالة
            بياناته من النظام.
            <br />
            <br />
            ملاحظة: التذاكر والتعليقات اللي أنشأها {entityLabel} هذا ستبقى محفوظة لضمان البيانات.
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
