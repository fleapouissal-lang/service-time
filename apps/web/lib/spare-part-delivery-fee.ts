/** Admin has not entered a delivery fee yet (column defaults to 0). */
export function isSparePartDeliveryFeePending(
  deliveryFee: number | null | undefined,
): boolean {
  return !(Number(deliveryFee) > 0);
}
