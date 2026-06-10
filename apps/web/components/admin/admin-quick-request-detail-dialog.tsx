"use client";

import type { QuickRequestRow } from "@/lib/quick-requests-queries";
import { QuickRequestDetailDialog } from "@/components/quick-requests/quick-request-detail-dialog";

type AdminQuickRequestDetailDialogProps = {
  request: QuickRequestRow | null;
  onClose: () => void;
  isRead?: boolean;
  onReadStatusChange?: (read: boolean, adminReadAt: string | null) => void;
};

export function AdminQuickRequestDetailDialog({
  request,
  onClose,
  isRead,
  onReadStatusChange,
}: AdminQuickRequestDetailDialogProps) {
  return (
    <QuickRequestDetailDialog
      request={request}
      onClose={onClose}
      variant="admin"
      isRead={isRead}
      onReadStatusChange={onReadStatusChange}
    />
  );
}
