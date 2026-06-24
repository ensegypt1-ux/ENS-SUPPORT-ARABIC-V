"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTicket } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface CustomizationActionsProps {
  requestId: string;
}

export function CustomizationActions({ requestId }: CustomizationActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteTicket(requestId);

      if (result.success) {
        toast.success("اتمسح طلب التخصيص");
        router.push("/admin/customization");
        router.refresh();
      } else {
        toast.error(result.error || "تعذّر الحذف طلب التخصيص");
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("تعذّر الحذف طلب التخصيص");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href={`/admin/customization/${requestId}/edit`}
              className="cursor-pointer"
            >
              <Edit className="me-2 h-4 w-4" />
              تعديل الطلب
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <Trash2 className="me-2 h-4 w-4" />
            حذف الطلب
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              مش هينفع الرجوع عن هذا الإجراء. سياتمسح طلب التخصيص وجميع
              التعليقات والمرفقات وسجل النشاط المرتبط به نهائيًا.
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
                "حذف"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
