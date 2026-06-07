import { cn } from "@/lib/utils";
import { formatSparePartPrice } from "@/lib/format-price";

export function SparePartPrice({
  price,
  className,
  size = "md",
}: {
  price: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "font-bold text-[#94D4B9]",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-xl",
        className,
      )}
      dir="ltr"
    >
      {formatSparePartPrice(price)}
    </span>
  );
}
