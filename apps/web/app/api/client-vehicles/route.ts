import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import {
  deleteClientVehicle,
  deleteClientVehicleAsAdmin,
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

export async function DELETE(request: Request) {
  const profile = await requireProfile(["admin", "client"]);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { label?: string; clientId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const label = (body.label ?? "").trim();
  if (!label) {
    return NextResponse.json({ error: "Missing vehicle label." }, { status: 400 });
  }

  const requestedClientId = body.clientId?.trim();
  const clientId = requestedClientId || profile.id;

  if (profile.role === "client" && clientId !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deleted =
    profile.role === "admin"
      ? await deleteClientVehicleAsAdmin(clientId, label)
      : await deleteClientVehicle(clientId, label);

  if (!deleted) {
    return NextResponse.json(
      { error: "Could not delete vehicle." },
      { status: 500 },
    );
  }

  const vehicles =
    profile.role === "admin"
      ? await getClientVehiclesAsAdmin(clientId)
      : await getClientVehicles(clientId);

  return NextResponse.json({
    ok: true,
    vehicles: vehicles.map((vehicle) => vehicle.label),
  });
}
