import { NextResponse } from "next/server";
import { getTrackingRequest } from "@/lib/queries";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const request = await getTrackingRequest(decodeURIComponent(token));

  if (!request) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    tracking_token: request.tracking_token,
    status: request.status,
  });
}
