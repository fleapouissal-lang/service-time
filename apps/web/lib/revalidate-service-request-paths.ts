import { revalidatePath } from "next/cache";

const SERVICE_REQUEST_DASHBOARD_PATHS = [
  "/admin",
  "/admin/orders",
  "/client",
  "/client/orders",
  "/client/request",
  "/client/track",
  "/technician",
  "/technician/orders",
  "/request",
] as const;

export function revalidateServiceRequestDashboards() {
  for (const pathname of SERVICE_REQUEST_DASHBOARD_PATHS) {
    revalidatePath(pathname);
  }
}
