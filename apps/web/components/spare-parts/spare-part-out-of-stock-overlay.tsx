import { cn } from "@/lib/utils";

export function SparePartOutOfStockOverlay({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center bg-[#050B10]/65 backdrop-blur-[2px]",
        className,
      )}
      aria-hidden
    >
      <span className="rounded-[20px] border border-red-400/40 bg-red-500/20 px-5 py-2 text-sm font-bold text-red-300">
        غير متوفر — نفذت الكمية
      </span>
    </div>
  );
}
