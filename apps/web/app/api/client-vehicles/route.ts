import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import {
  getClientVehicles,
  getClientVehiclesAsAdmin,
} from "@/lib/client-vehicles";

export async function GET(request: Request) {
  const profile = await requireProfile(["admin", "client"]);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedClientId = searchParams.get("clientId")?.trim();
  const clientId = requestedClientId || profile.id;

  if (profile.role === "client" && clientId !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const vehicles =
    profile.role === "admin"
      ? await getClientVehiclesAsAdmin(clientId)
      : await getClientVehicles(clientId);

  return NextResponse.json({
    vehicles: vehicles.map((vehicle) => vehicle.label),
  });
}
