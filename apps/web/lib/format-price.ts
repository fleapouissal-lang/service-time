export function formatSparePartPrice(price: number): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function getLineTotal(price: number, quantity: number): number {
  return Math.round(price * quantity * 100) / 100;
}

export function getCartTotalAmount(
  items: { price: number; quantity: number }[],
): number {
  return items.reduce(
    (sum, item) => sum + getLineTotal(item.price, item.quantity),
    0,
  );
}
