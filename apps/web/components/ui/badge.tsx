import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline" | "success";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "secondary" &&
          "bg-primary/15 text-primary border border-primary/20",
        variant === "outline" &&
          "border border-border bg-card text-foreground",
        variant === "success" &&
          "bg-primary/20 text-primary border border-primary/30",
        className,
      )}
      {...props}
    />
  );
}
