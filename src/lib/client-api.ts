import type { PickedPhoto, PickingSession, TrayItem } from "@/lib/types";

async function readError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    /* ignore */
  }
  return `Error ${response.status}`;
}

export async function apiCreateSession(token: string): Promise<PickingSession> {
  const response = await fetch("/api/picker/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as PickingSession;
}

export async function apiPollSession(token: string, id: string) {
  const response = await fetch(`/api/picker/sessions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as PickingSession;
}

export async function apiListItems(token: string, id: string) {
  const response = await fetch(
    `/api/picker/sessions/${encodeURIComponent(id)}/items`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error(await readError(response));
  const body = (await response.json()) as { items: PickedPhoto[] };
  return body.items ?? [];
}

export async function apiCreateInvite(email: string, name: string) {
  const response = await fetch("/api/invites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name }),
    signal: AbortSignal.timeout(10000),
  });
  const body = (await response.json()) as {
    error?: string;
    invite?: { token: string; email: string; name: string; expiresAt: string };
    link?: string;
    subject?: string;
    text?: string;
    gmailUrl?: string;
    mailtoUrl?: string;
    sent?: boolean;
    provider?: "resend" | "link";
  };
  if (!response.ok && !body.link) {
    throw new Error(body.error || `Error ${response.status}`);
  }
  if (!body.link || !body.invite) {
    throw new Error(body.error || "No pude crear la invitación.");
  }
  return body as {
    invite: { token: string; email: string; name: string; expiresAt: string };
    link: string;
    subject: string;
    text: string;
    gmailUrl: string;
    mailtoUrl: string;
    sent: boolean;
    provider: "resend" | "link";
    error?: string;
  };
}

export async function apiReadInvite(token: string) {
  const response = await fetch(`/api/invites/${encodeURIComponent(token)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as {
    email: string;
    name: string;
    expiresAt: string;
    completedAt: string | null;
  };
}

export async function apiDeliverInvitePhotos(
  inviteToken: string,
  photos: PickedPhoto[],
  googleToken: string | null,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (googleToken) headers.Authorization = `Bearer ${googleToken}`;
  const response = await fetch(
    `/api/invites/${encodeURIComponent(inviteToken)}/photos`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ photos }),
    },
  );
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as {
    added: number;
    skipped: number;
    notice: string;
  };
}

export async function apiReadTray() {
  const response = await fetch("/api/tray", {
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw new Error(await readError(response));
  const body = (await response.json()) as { items?: TrayItem[] };
  return body.items ?? [];
}

export async function apiPatchTray(payload: {
  id?: string;
  action: "reject" | "vote" | "clearRejected";
  role?: "authorYes" | "tutorYes";
  value?: boolean;
}) {
  const response = await fetch("/api/tray", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readError(response));
  const body = (await response.json()) as { items?: TrayItem[] };
  return body.items ?? [];
}

export async function apiFileObjectUrl(
  token: string,
  baseUrl: string,
  variant: "thumb" | "download" = "thumb",
) {
  const response = await fetch("/api/picker/file", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ baseUrl, variant }),
  });
  if (!response.ok) throw new Error(await readError(response));
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
