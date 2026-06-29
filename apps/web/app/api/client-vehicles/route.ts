import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import {
  deleteClientVehicle,
  deleteClientVehicleAsAdmin,
  deleteClientVehicleByLabel,
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

  return NextResponse.json({ vehicles });
}

export async function DELETE(request: Request) {
  const profile = await requireProfile(["admin", "client"]);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { label?: string; id?: string; clientId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const requestedClientId = body.clientId?.trim();
  const clientId = requestedClientId || profile.id;

  if (profile.role === "client" && clientId !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const vehicleId = body.id?.trim();
  const label = (body.label ?? "").trim();

  if (!vehicleId && !label) {
    return NextResponse.json({ error: "Missing vehicle id or label." }, { status: 400 });
  }

  const deleted =
    profile.role === "admin"
      ? label
        ? await deleteClientVehicleAsAdmin(clientId, label)
        : false
      : vehicleId
        ? await deleteClientVehicle(clientId, vehicleId)
        : await deleteClientVehicleByLabel(clientId, label);

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

  return NextResponse.json({ ok: true, vehicles });
}
