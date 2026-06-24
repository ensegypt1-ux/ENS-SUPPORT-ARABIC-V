"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { UserFormDialog } from "./user-form-dialog";

export function CreateCustomerButton() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        <UserPlus className="me-2 h-4 w-4" />
        إنشاء عميل
      </Button>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={null}
        mode="create"
        entityLabel="عميل"
        audience="customer"
      />
    </>
  );
}
