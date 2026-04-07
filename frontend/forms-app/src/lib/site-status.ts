export type SiteStatus = {
  acceptingResponses: boolean;
  passwordInitialized: boolean;
  updatedAt?: string;
};

export type SiteConfigUpdate = {
  acceptingResponses?: boolean;
  adminPassword?: string;
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || "Request failed");
  }

  return response.json() as Promise<T>;
}

export async function fetchSiteStatus(): Promise<SiteStatus> {
  const response = await fetch("/api/site-config");
  return readJsonResponse<SiteStatus>(response);
}

export async function fetchAdminSiteConfig(token: string): Promise<SiteStatus> {
  const response = await fetch("/api/admin/site-config", {
    headers: { "x-admin-token": token },
  });

  return readJsonResponse<SiteStatus>(response);
}

export async function updateAdminSiteConfig(token: string, updates: SiteConfigUpdate): Promise<SiteStatus> {
  const response = await fetch("/api/admin/site-config", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token,
    },
    body: JSON.stringify(updates),
  });

  return readJsonResponse<SiteStatus>(response);
}