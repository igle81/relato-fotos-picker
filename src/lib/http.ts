import { NextResponse } from "next/server";

export function bearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

export function missingToken() {
  return NextResponse.json(
    { error: "Falta el token de Google. Conecta la cuenta otra vez." },
    { status: 401 },
  );
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
