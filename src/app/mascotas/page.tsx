import { PickerApp } from "@/components/picker-app";
import { safeReturnUrl } from "@/lib/remember-house";

type Search = {
  role?: string;
  name?: string;
  return?: string;
};

export default async function MascotasPickerPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const query = await searchParams;
  const role =
    query.role === "tutor" || query.role === "principal" ? query.role : "tutor";
  const visitorName = query.name?.trim() || undefined;

  return (
    <PickerApp
      from="mascotas"
      role={role}
      visitorName={visitorName}
      returnUrl={safeReturnUrl(query.return)}
    />
  );
}
