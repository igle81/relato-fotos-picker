import { PickerApp } from "@/components/picker-app";

type Search = {
  from?: string;
  role?: string;
  name?: string;
  return?: string;
};

function safeReturnUrl(raw?: string) {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    const host = url.hostname;
    const allowed =
      host === "localhost" ||
      host === "127.0.0.1" ||
      (host.endsWith(".vercel.app") && host.includes("relato"));
    if (!allowed || (url.protocol !== "https:" && host !== "localhost" && host !== "127.0.0.1")) {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const query = await searchParams;
  const from =
    query.from === "mascotas" || query.from === "relato" ? query.from : undefined;
  const role =
    query.role === "tutor" || query.role === "principal" ? query.role : undefined;
  const visitorName = query.name?.trim() || undefined;

  return (
    <PickerApp
      from={from}
      role={role}
      visitorName={visitorName}
      returnUrl={safeReturnUrl(query.return)}
    />
  );
}
