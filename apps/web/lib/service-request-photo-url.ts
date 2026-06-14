export function serviceRequestPhotoApiUrl(
  requestId: string,
  photoId: string,
  download = false,
): string {
  const params = new URLSearchParams({ requestId, photoId });
  if (download) {
    params.set("download", "1");
  }
  return `/api/service-request-photo?${params.toString()}`;
}
