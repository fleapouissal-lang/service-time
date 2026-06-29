"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ClientVehicle, VehicleFuelType } from "@service-time/types";
import { requireProfile } from "@/lib/auth";
import { createClientVehicle } from "@/lib/client-vehicles";
import type { ClientVehicleInput } from "@/lib/client-vehicle-display";

export type AddClientVehicleState = {
  error?: string;
  vehicle?: ClientVehicle;
};

function parseFuelType(value: string): VehicleFuelType | null {
  if (
    value === "gasoline" ||
    value === "diesel" ||
    value === "electric" ||
    value === "hybrid"
  ) {
    return value;
  }
  return null;
}

export async function addClientVehicleAction(
  _prev: AddClientVehicleState,
  formData: FormData,
): Promise<AddClientVehicleState> {
  const profile = await requireProfile(["client"]);
  if (!profile) {
    return { error: "unauthorized" };
  }

  const brandSlug = String(formData.get("brand_slug") ?? "").trim();
  const modelId = String(formData.get("model_id") ?? "").trim();
  const brandName = String(formData.get("brand_name") ?? "").trim();
  const modelName = String(formData.get("model_name") ?? "").trim();
  const cylindersRaw = String(formData.get("cylinders") ?? "").trim();
  const chassisNumber = String(formData.get("chassis_number") ?? "").trim();
  const plateLetters = String(formData.get("plate_letters") ?? "").trim();
  const plateNumber = String(formData.get("plate_number") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const yearRaw = String(formData.get("year") ?? "").trim();
  const next = String(formData.get("next") ?? "").trim();
  const stayOnPage = String(formData.get("stay_on_page") ?? "") === "1";

  if (!brandSlug || !modelId || !brandName || !modelName) {
    return { error: "required_fields" };
  }

  const cylinders = cylindersRaw ? Number.parseInt(cylindersRaw, 10) : null;
  const year = yearRaw ? Number.parseInt(yearRaw, 10) : null;
  const parsedFuel = parseFuelType(String(formData.get("fuel_type") ?? "").trim());

  const input: ClientVehicleInput = {
    brandSlug,
    modelId,
    brandName,
    modelName,
    cylinders: Number.isFinite(cylinders) ? cylinders : null,
    fuelType: parsedFuel,
    chassisNumber: chassisNumber || null,
    plateLetters: plateLetters || null,
    plateNumber: plateNumber || null,
    color: color || null,
    year: Number.isFinite(year) ? year : null,
  };

  const { vehicle, error } = await createClientVehicle(profile.id, input);

  if (error === "duplicate") {
    return { error: "duplicate" };
  }
  if (!vehicle) {
    return { error: "insert_failed" };
  }

  revalidatePath("/client/vehicles");
  revalidatePath("/client/request");
  revalidatePath("/request");

  if (stayOnPage) {
    return { vehicle };
  }

  if (next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }
  redirect("/client/vehicles");
}
