import { redirect } from "next/navigation";

export default function SuperAdminKelasPage() {
  redirect("/super-admin?tab=KELAS");
}
