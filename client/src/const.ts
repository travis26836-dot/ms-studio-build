/**
 * Dynamically resolve portal URL based on environment or runtime detection.
 * Falls back to checking common local dev ports if env var not set.
 */
function resolvePortalUrl(): string {
  const envUrl = (import.meta as { env?: { VITE_PORTAL_URL?: string } }).env
    ?.VITE_PORTAL_URL;

  if (envUrl) {
    return envUrl;
  }

  if (typeof window === "undefined") {
    return "http://localhost:3000";
  }

  // At runtime, derive portal from main app's location
  // Portal typically runs on a different port: if main is 3002, portal is 3003, etc.
  const mainPort = window.location.port;
  if (!mainPort) {
    return "http://localhost:3000"; // Fallback for non-port URLs
  }

  const mainPortNum = parseInt(mainPort, 10);
  const portalPortNum = mainPortNum + 1; // Portal runs on next port

  return `${window.location.protocol}//${window.location.hostname}:${portalPortNum}`;
}

export function getLoginUrl() {
  return "/sign-in";
}

export function getPortalUrl(options?: { returnTo?: string; user?: { name: string; email: string } }) {
  const baseUrl = resolvePortalUrl();

  if (!options?.returnTo && !options?.user) {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);
    if (options.returnTo) {
      url.searchParams.set("mainAppUrl", options.returnTo);
    }
    if (options.user) {
      url.searchParams.set("userName", options.user.name);
      url.searchParams.set("userEmail", options.user.email);
    }
    return url.toString();
  } catch {
    return baseUrl;
  }
}
