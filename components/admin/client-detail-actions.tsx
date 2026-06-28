"use client";

import { useState } from "react";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { UserFormDialog } from "./user-form-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";

interface ClientDetailActionsProps {
  user: User;
  isAdmin: boolean;
}

export function ClientDetailActions({ user, isAdmin }: ClientDetailActionsProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
          <Edit className="h-4 w-4 me-2" />
          تعديل العميل
        </Button>
      )}
      {isAdmin && (
        <Button
          variant="outline"
          onClick={() => setDeleteDialogOpen(true)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 me-2" />
          حذف العميل
        </Button>
      )}

      {isAdmin && (
        <UserFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={user}
          mode="edit"
          entityLabel="عميل"
        />
      )}

      {isAdmin && (
        <DeleteUserDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          user={user}
          entityLabel="عميل"
          redirectTo="/admin/customers"
        />
      )}
    </div>
  );
}
