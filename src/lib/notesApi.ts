export type NotePayload = {
  title: string;
  content: string;
  tags?: string[];
  patientId?: string;
  pin?: string;
  isPinned?: boolean;
};

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const bustUrl = url.includes("?") ? `${url}&_=${Date.now()}` : `${url}?_=${Date.now()}`;

  const res = await fetch(bustUrl, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      ...init?.headers,
    },
  });

  const data = await res.json().catch(() => ({
    success: false,
    error: res.status === 404
      ? "Server API missing — latest code is not deployed on live yet"
      : `Request failed (${res.status})`,
  }));

  if (res.status === 404) {
    return {
      success: false,
      error: "Server API missing — latest code is not deployed on live yet",
      notes: [],
    } as T;
  }

  if (typeof data === "object" && data !== null && "success" in data) {
    return data as T;
  }

  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error || `Request failed (${res.status})`
    );
  }

  return data as T;
}

export async function fetchNotesApi() {
  return apiFetch<{
    success: boolean;
    notes: Array<{
      id: string;
      title: string;
      content: string;
      updatedAt: string;
      tags: string[];
      patientId?: string;
      isLocked?: boolean;
      pin?: string;
      isPinned?: boolean;
    }>;
    error?: string;
  }>("/api/notes");
}

export async function saveNoteApi(id: string, data: NotePayload) {
  return apiFetch<{
    success: boolean;
    note?: {
      id: string;
      title: string;
      content: string;
      updatedAt: string;
      tags: string[];
      patientId?: string;
      isLocked?: boolean;
      isPinned?: boolean;
    };
    error?: string;
  }>(`/api/notes/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteNoteApi(id: string) {
  return apiFetch<{ success: boolean; error?: string }>(
    `/api/notes/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

export async function togglePinApi(id: string, isPinned: boolean) {
  return apiFetch<{ success: boolean; isPinned?: boolean; error?: string }>(
    `/api/notes/${encodeURIComponent(id)}/pin`,
    {
      method: "PATCH",
      body: JSON.stringify({ isPinned }),
    }
  );
}

export async function unlockNoteApi(id: string, pin: string) {
  return apiFetch<{
    success: boolean;
    note?: {
      id: string;
      title: string;
      content: string;
      updatedAt: string;
      tags: string[];
      patientId?: string;
      isLocked?: boolean;
      pin?: string;
      isPinned?: boolean;
    };
    error?: string;
  }>(`/api/notes/${encodeURIComponent(id)}/unlock`, {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}
