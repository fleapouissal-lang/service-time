import { redirect } from "next/navigation";

export default function AdminTechniciansRedirectPage() {
  redirect("/admin/users");
}
