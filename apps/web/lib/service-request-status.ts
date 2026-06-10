import { ServiceRequestStatus } from "@service-time/types";

/** Admin update: auto-set assigned when a technician is selected. */
export function resolveOrderStatusOnAdminUpdate(
  status: ServiceRequestStatus,
  assignedTechnicianId: string | null,
): ServiceRequestStatus {
  if (assignedTechnicianId) {
    if (
      status === ServiceRequestStatus.RECEIVED ||
      status === ServiceRequestStatus.ASSIGNED
    ) {
      return ServiceRequestStatus.ASSIGNED;
    }
    return status;
  }

  if (status === ServiceRequestStatus.ASSIGNED) {
    return ServiceRequestStatus.RECEIVED;
  }

  return status;
}
