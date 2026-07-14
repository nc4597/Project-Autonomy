import type { AdminDeal, AdminSiteSettings } from "./adminTypes";

const ADMIN_API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? "http://localhost:3100";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${ADMIN_API_BASE_URL}${path}`, {
    // Deal content changes through the admin tool at any time and this
    // is a marketing site, not a high-traffic API — revalidate often
    // rather than serving stale content indefinitely.
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`Admin API request failed: ${path} (${response.status})`);
  }

  return response.json();
}

export async function getDeals(): Promise<AdminDeal[]> {
  const { deals } = await request<{ deals: AdminDeal[] }>("/api/public/deals");
  return deals;
}

export async function getDealBySlug(slug: string): Promise<AdminDeal | null> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/api/public/deals/${encodeURIComponent(slug)}`,
    { next: { revalidate: 30 } }
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Admin API request failed: /api/public/deals/${slug} (${response.status})`);
  }
  const { deal } = await response.json();
  return deal;
}

export async function getSiteSettings(): Promise<AdminSiteSettings> {
  return request<AdminSiteSettings>("/api/public/site-settings");
}
