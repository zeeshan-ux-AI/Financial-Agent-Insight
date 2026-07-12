/**
 * Returns the base URL for API fetch calls.
 * - In production (Vercel), uses VITE_API_BASE_URL pointing to Render backend.
 * - In development/Replit, proxies via /api/ on the same host.
 */
export function apiUrl(path: string): string {
  const clean = path.replace(/^\/+/, '');
  const base = import.meta.env.VITE_API_BASE_URL;
  if (base) {
    // Production: call Render backend directly
    return `${base.replace(/\/+$/, '')}/api/${clean}`;
  }
  // Development/Replit: same-host proxy
  return `/api/${clean}`;
}
