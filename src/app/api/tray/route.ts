import { NextResponse } from "next/server";
import { fail } from "@/lib/http";
import { readStore, updateStore } from "@/lib/store";
import type { TrayItem } from "@/lib/types";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ items: store.tray });
}

export async function PATCH(request: Request) {
  let payload: {
    id?: string;
    action?: "reject" | "vote" | "clearRejected";
    role?: "authorYes" | "tutorYes";
    value?: boolean;
  };
  try {
    payload = (await request.json()) as {
      id?: string;
      action?: "reject" | "vote" | "clearRejected";
      role?: "authorYes" | "tutorYes";
      value?: boolean;
    };
  } catch {
    return fail("Cuerpo JSON no válido.");
  }

  const store = await updateStore((current) => {
    if (payload.action === "clearRejected") {
      return {
        ...current,
        tray: current.tray.filter((item) => item.status === "pending"),
      };
    }
    if (!payload.id) return current;
    const tray: TrayItem[] = current.tray.map((item) => {
      if (item.id !== payload.id) return item;
      if (payload.action === "reject") {
        return { ...item, status: "rejected" as const };
      }
      if (payload.action === "vote" && payload.role) {
        return { ...item, [payload.role]: Boolean(payload.value) };
      }
      return item;
    });
    return { ...current, tray };
  });

  return NextResponse.json({ items: store.tray });
}
