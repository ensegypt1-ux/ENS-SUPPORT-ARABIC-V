"use client";

import { useState } from "react";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { UserFormDialog } from "./user-form-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";

interface UserDetailActionsProps {
  user: User;
  isAdmin: boolean;
}

export function UserDetailActions({ user, isAdmin }: UserDetailActionsProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
          <Edit className="h-4 w-4 me-2" />
          تعديل المستخدم
        </Button>
      )}
      {isAdmin && (
        <Button
          variant="outline"
          onClick={() => setDeleteDialogOpen(true)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 me-2" />
          حذف المستخدم
        </Button>
      )}

      {isAdmin && (
        <UserFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={user}
          mode="edit"
          entityLabel="عضو الفريق"
          audience="team"
        />
      )}

      {isAdmin && (
        <DeleteUserDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          user={user}
          entityLabel="عضو الفريق"
          redirectTo="/admin/users"
        />
      )}
    </div>
  );
}
