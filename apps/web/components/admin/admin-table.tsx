import { cn } from "@/lib/utils";

export const adminTableWrapClass = "overflow-x-auto";

export const adminTableClass =
  "w-full min-w-[960px] border-collapse text-sm [&_th]:align-middle [&_td]:align-middle";

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
      <tr className={cn("border-b border-border bg-muted/30", className)}>
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
        "px-4 py-3 font-medium text-muted whitespace-nowrap",
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
}: {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  ltr?: boolean;
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
    >
      {children}
    </td>
  );
}

/** Colonne client : nom + lignes LTR (téléphone) sans mélange bidi en RTL */
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
    <div className={cn("flex min-w-[11rem] max-w-[15rem] flex-col gap-1", className)}>
      <span className="block font-semibold leading-snug">{name}</span>
      {phone ? (
        <span
          dir="ltr"
          className="block w-full text-end text-xs tabular-nums text-muted [unicode-bidi:isolate]"
        >
          {phone}
        </span>
      ) : null}
      {extra ? (
        <span
          dir="auto"
          className="block w-full text-xs text-muted [unicode-bidi:isolate]"
        >
          {extra}
        </span>
      ) : null}
    </div>
  );
}
