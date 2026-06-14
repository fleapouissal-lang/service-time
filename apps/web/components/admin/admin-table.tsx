import { cn } from "@/lib/utils";

export const adminTableWrapClass = "admin-table-wrap overflow-x-auto";

export const adminTableClass =
  "admin-table w-full min-w-[960px] border-separate border-spacing-0 text-sm [&_th]:align-middle [&_td]:align-middle";

export function AdminTable({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={adminTableWrapClass}>
      <table className={cn(adminTableClass, className)}>{children}</table>
    </div>
  );
}

export function AdminTableHead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <thead>
      <tr className={cn("admin-table-head", className)}>
        {children}
      </tr>
    </thead>
  );
}

export function AdminTableHeadCell({
  children,
  className,
  align = "start",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}) {
  return (
    <th
      className={cn(
        "admin-table-head-cell px-4 py-3 font-medium whitespace-nowrap",
        align === "center" && "text-center",
        align === "end" && "text-end",
        align === "start" && "text-start",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function AdminTableCell({
  children,
  className,
  align,
  ltr = false,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  ltr?: boolean;
  onClick?: React.MouseEventHandler<HTMLTableCellElement>;
}) {
  const resolvedAlign = align ?? (ltr ? "center" : "start");

  return (
    <td
      className={cn(
        "px-4 py-3",
        resolvedAlign === "center" && "text-center",
        resolvedAlign === "end" && "text-end",
        resolvedAlign === "start" && "text-start",
        ltr && "tabular-nums whitespace-nowrap [direction:ltr] [unicode-bidi:isolate]",
        className,
      )}
      dir={ltr ? "ltr" : undefined}
      onClick={onClick}
    >
      {children}
    </td>
  );
}

/** Colonne client : nom + téléphone / email alignés selon la langue (start logique) */
export function AdminTableCustomerInfo({
  name,
  phone,
  extra,
  className,
}: {
  name: string;
  phone?: string | null;
  extra?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-[11rem] max-w-[15rem] flex-col items-start gap-1 text-start",
        className,
      )}
    >
      <span className="block font-semibold leading-snug">{name}</span>
      {phone ? (
        <span
          dir="ltr"
          className="block max-w-full text-xs tabular-nums text-muted [unicode-bidi:isolate]"
        >
          {phone}
        </span>
      ) : null}
      {extra ? (
        <span
          dir="ltr"
          className="block max-w-full break-all text-xs text-muted [unicode-bidi:isolate]"
        >
          {extra}
        </span>
      ) : null}
    </div>
  );
}
