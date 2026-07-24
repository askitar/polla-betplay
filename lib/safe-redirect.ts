// Only ever redirect to a relative in-app path, never an external URL.
export function safeRedirectTarget(url: string | undefined, fallback: string): string {
  if (url && url.startsWith("/") && !url.startsWith("//")) return url;
  return fallback;
}
