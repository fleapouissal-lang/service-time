import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Forward / “view more” arrow — points inline-end (→ LTR, ← RTL). */
export function LocaleForwardArrow({ className }: { className?: string }) {
  return (
    <ArrowLeft
      className={cn("size-4 ltr:rotate-180", className)}
      aria-hidden
    />
  );
}

/** Carousel previous — flex `dir` swaps sides in RTL; icon points toward prior slide. */
export function LocaleCarouselPrev({ className }: { className?: string }) {
  return <ChevronLeft className={cn("size-4", className)} aria-hidden />;
}

/** Pagination previous — points toward lower page numbers. */
export function LocalePaginationPrev({ className }: { className?: string }) {
  return (
    <ChevronLeft className={cn("size-4 rtl:rotate-180", className)} aria-hidden />
  );
}

/** Pagination next — points toward higher page numbers. */
export function LocalePaginationNext({ className }: { className?: string }) {
  return (
    <ChevronRight className={cn("size-4 rtl:rotate-180", className)} aria-hidden />
  );
}

/** Carousel next — flex `dir` swaps sides in RTL; icon points toward next slide. */
export function LocaleCarouselNext({ className }: { className?: string }) {
  return <ChevronRight className={cn("size-4", className)} aria-hidden />;
}
