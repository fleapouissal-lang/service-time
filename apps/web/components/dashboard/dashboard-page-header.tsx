import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardPageHeaderProps = {
  title: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function DashboardPageHeader({
  title,
  children,
  className,
}: DashboardPageHeaderProps) {
  return (
    <div className={cn("hidden md:block", className)}>
      <h1 className="text-2xl font-bold">{title}</h1>
      {children}
    </div>
  );
}
