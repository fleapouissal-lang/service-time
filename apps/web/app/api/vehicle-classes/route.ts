import { NextResponse } from "next/server";
import { getPublicVehicleClasses } from "@/lib/vehicle-classes-admin";

export async function GET() {
  const classes = await getPublicVehicleClasses();
  return NextResponse.json({
    classes: classes.map((row) => ({
      id: row.id,
      nameAr: row.nameAr,
      nameEn: row.nameEn,
      sort_order: row.sort_order,
      is_active: row.is_active,
    })),
  });
}
