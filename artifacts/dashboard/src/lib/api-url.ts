/**
 * Returns the base URL for direct API fetch calls.
 * The API server is proxied at /api/ regardless of the dashboard's base path.
 */
export function apiUrl(path: string): string {
  // Strip leading slash from path to avoid double slashes
  const clean = path.replace(/^\/+/, '');
  return `/api/${clean}`;
}
