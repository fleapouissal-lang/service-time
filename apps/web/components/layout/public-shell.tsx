"use client";

import { usePathname } from "next/navigation";

const DASHBOARD_PREFIXES = ["/admin", "/technician", "/client", "/login"];

type PublicShellProps = {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
};

export function PublicShell({ children, header, footer }: PublicShellProps) {
  const pathname = usePathname();
  const isDashboard = DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p));

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      <main className="flex-1 bg-[#060709]">{children}</main>
      {footer}
    </>
  );
}
