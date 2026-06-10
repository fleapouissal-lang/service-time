import Link from "next/link";
import { CheckCircle2, Circle, Eye, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const actionBtnClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors";

type AdminTableActionsProps = {
  viewHref?: string;
  onView?: () => void;
  editHref?: string;
  onEdit?: () => void;
  viewLabel: string;
  editLabel: string;
  onToggleRead?: () => void;
  toggleReadLabel?: string;
  isRead?: boolean;
  deleteLabel?: string;
  onDelete?: () => void;
  className?: string;
};

export function AdminTableActions({
  viewHref,
  onView,
  editHref,
  onEdit,
  viewLabel,
  editLabel,
  onToggleRead,
  toggleReadLabel,
  isRead,
  deleteLabel,
  onDelete,
  className,
}: AdminTableActionsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-1.5", className)}>
      {onView ? (
        <button
          type="button"
          onClick={onView}
          className={cn(actionBtnClass, "hover:bg-primary/5 hover:text-primary")}
          title={viewLabel}
          aria-label={viewLabel}
        >
          <Eye className="size-4" aria-hidden />
        </button>
      ) : viewHref ? (
        <Link
          href={viewHref}
          className={cn(actionBtnClass, "hover:bg-primary/5 hover:text-primary")}
          title={viewLabel}
          aria-label={viewLabel}
        >
          <Eye className="size-4" aria-hidden />
        </Link>
      ) : null}
      {onToggleRead && toggleReadLabel ? (
        <button
          type="button"
          onClick={onToggleRead}
          className={cn(
            actionBtnClass,
            isRead
              ? "hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
              : "hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400",
          )}
          title={toggleReadLabel}
          aria-label={toggleReadLabel}
        >
          {isRead ? (
            <Circle className="size-4" aria-hidden />
          ) : (
            <CheckCircle2 className="size-4" aria-hidden />
          )}
        </button>
      ) : null}
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className={cn(actionBtnClass, "hover:bg-primary/5 hover:text-primary")}
          title={editLabel}
          aria-label={editLabel}
        >
          <Pencil className="size-4" aria-hidden />
        </button>
      ) : editHref ? (
        <Link
          href={editHref}
          className={cn(actionBtnClass, "hover:bg-primary/5 hover:text-primary")}
          title={editLabel}
          aria-label={editLabel}
        >
          <Pencil className="size-4" aria-hidden />
        </Link>
      ) : null}
      {onDelete && deleteLabel ? (
        <button
          type="button"
          onClick={onDelete}
          className={cn(
            actionBtnClass,
            "hover:border-red-400/40 hover:bg-red-950/30 hover:text-red-400",
          )}
          title={deleteLabel}
          aria-label={deleteLabel}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
