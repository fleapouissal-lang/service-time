import type { SparePart } from "@service-time/types";

export function getSparePartStock(
  part: Pick<SparePart, "stock_quantity">,
): number {
  return Math.max(0, Number(part.stock_quantity) || 0);
}

export function isSparePartInStock(
  part: Pick<SparePart, "stock_quantity">,
): boolean {
  return getSparePartStock(part) > 0;
}
