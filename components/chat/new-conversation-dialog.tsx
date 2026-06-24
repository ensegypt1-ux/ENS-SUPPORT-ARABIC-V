/**
 * New Conversation Dialog
 *
 * Dialog for creating a new conversation with selected users.
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createConversation } from "@/actions/messages";
import {
  Loader2,
  Search,
  Check,
  X,
  MessageCircle,
  User,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NameWithRole } from "@/components/shared/name-with-role";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  currentUserRole: UserRole;
  onConversationCreated: (conversationId: string) => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function NewConversationDialog({
  open,
  onOpenChange,
  currentUserId,
  currentUserRole,
  onConversationCreated,
}: NewConversationDialogProps) {
  const [step, setStep] = useState<"type" | "participants">("type");
  const [conversationType, setConversationType] = useState<
    "direct" | "group" | null
  >(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch users when moving to participants step
  useEffect(() => {
    if (open && step === "participants") {
      fetchUsers();
    } else if (!open) {
      // Reset form when dialog closes
      setStep("type");
      setConversationType(null);
      setSelectedUserIds([]);
      setSearchQuery("");
    }
  }, [open, step]);

  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        // Filter out current user
        const otherUsers = data.users.filter(
          (u: User) => u.id !== currentUserId
        );

        // If current user is a customer, only allow selecting support or admin users
        const visibleUsers: User[] =
          currentUserRole === "customer"
            ? otherUsers.filter(
                (u: User) => u.role === "support" || u.role === "admin"
              )
            : otherUsers;

        setUsers(visibleUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("تعذّر التحميل المستخدمين");
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUserIds.length === 0) {
      toast.error("اختار مستخدم واحد على الأقل");
      return;
    }

    // Validate based on conversation type
    if (conversationType === "direct" && selectedUserIds.length > 1) {
      toast.error("يمكن أن تحتوي الرسائل المباشرة على مشارك واحد فقط");
      return;
    }

    if (conversationType === "group" && selectedUserIds.length < 2) {
      toast.error("لازم فيه المحادثات الجماعية على مشاركين على الأقل");
      return;
    }

    setLoading(true);

    try {
      const result = await createConversation({
        participantIds: selectedUserIds,
      });

      if (result.success && result.data) {
        toast.success("اتعمل المحادثة");
        onConversationCreated(result.data.id);
      } else {
        toast.error(result.error || "تعذّر الإنشاء المحادثة");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("حصل خطأ مش متوقع");
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        // For direct messages, only allow one participant
        if (conversationType === "direct") {
          return [userId];
        }
        return [...prev, userId];
      }
    });
  };

  const removeUser = (userId: string) => {
    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUsers = users.filter((user) =>
    selectedUserIds.includes(user.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] gap-0">
        {step === "type" ? (
          // Step 1: Choose Conversation Type
          <>
            <DialogHeader className="gap-0">
              <DialogTitle className="text-lg font-bold">
                اختيار نوع المحادثة
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground">
                اختر نوع المحادثة التي تريد إنشاءها.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              {/* Direct Message Option */}
              <button
                type="button"
                onClick={() => setConversationType("direct")}
                className={cn(
                  "flex flex-col items-start gap-3 p-5 rounded-lg border-2 transition-all",
                  "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20",
                  "focus-visible:outline-none",
                  conversationType === "direct"
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                    : "border-border"
                )}
              >
                <User className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                <div className="text-start">
                  <h3 className="font-semibold text-base mb-1">
                    رسالة مباشرة
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    ابدأ محادثة خاصة مع شخص واحد
                  </p>
                </div>
              </button>

              {/* Group Chat Option */}
              <button
                type="button"
                onClick={() => setConversationType("group")}
                className={cn(
                  "flex flex-col items-start gap-3 p-5 rounded-lg border-2 transition-all",
                  "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20",
                  "focus-visible:outline-none",
                  conversationType === "group"
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                    : "border-border"
                )}
              >
                <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                <div className="text-start">
                  <h3 className="font-semibold text-base mb-1">محادثة جماعية</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    أنشئ محادثة جماعية مع عدة أشخاص
                  </p>
                </div>
              </button>
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  if (conversationType) {
                    setStep("participants");
                  }
                }}
                disabled={!conversationType}
                className="bg-blue-600 hover:bg-blue-700"
              >
                التالي
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Step 2: Select Participants
          <form onSubmit={handleSubmit}>
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold">
                {conversationType === "direct"
                  ? "اختيار شخص"
                  : "إضافة مشاركين"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {conversationType === "direct"
                  ? "اختر شخصاً واحداً للمراسلة."
                  : "اختر من تريد إضافته إلى هذه المحادثة الجماعية."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Selected Participants */}
              {selectedUsers.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    المشاركون المختارون ({selectedUsers.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <Badge
                        key={user.id}
                        variant="secondary"
                        className="ps-2 pe-1 py-1.5 gap-2"
                      >
                        <Avatar className="h-5 w-5">
                          {user.image && <AvatarImage src={user.image} />}
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <NameWithRole
                          name={user.name}
                          role={user.role}
                          className="text-sm"
                          badgeClassName="h-4 px-2 text-[10px]"
                        />
                        <button
                          type="button"
                          onClick={() => removeUser(user.id)}
                          className="ms-1 rounded-full hover:bg-muted p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Participants */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  إضافة مشاركين
                </h3>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث عن مستخدمين..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9"
                  />
                </div>

                {/* User List */}
                <div className="border rounded-lg max-h-80 overflow-y-auto">
                  {fetchingUsers ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      جارٍ تحميل المستخدمين...
                    </p>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      ملقيناش مستخدمين
                    </p>
                  ) : (
                    <div className="divide-y">
                      {filteredUsers.map((user) => {
                        const isSelected = selectedUserIds.includes(user.id);
                        return (
                          <div
                            key={user.id}
                            onClick={() => toggleUser(user.id)}
                            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                              isSelected ? "bg-blue-50 dark:bg-blue-950/30" : ""
                            }`}
                          >
                            <Avatar className="h-10 w-10">
                              {user.image && <AvatarImage src={user.image} />}
                              <AvatarFallback className="text-sm">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                <NameWithRole
                                  name={user.name}
                                  role={user.role}
                                  className="text-sm font-medium"
                                  badgeClassName="h-4 px-2 text-[10px]"
                                />
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="h-5 w-5 text-blue-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("type")}
                className="sm:me-2"
              >
                رجوع
              </Button>
              <Button
                type="submit"
                disabled={loading || selectedUserIds.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                إنشاء محادثة
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
