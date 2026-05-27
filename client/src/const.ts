/**
 * Dynamically resolve portal URL based on environment variable.
 * Uses VITE_PORTAL_URL which should be set in Railway environment.
 */
const LOCAL_PORTAL_URL = "http://127.0.0.1:3004";

function resolvePortalUrl(): string {
  const envUrl = (import.meta as { env?: { VITE_PORTAL_URL?: string } }).env
    ?.VITE_PORTAL_URL;

  if (envUrl) {
    return envUrl;
  }

  // Fallback for local development only
  if (typeof window === "undefined") {
    return LOCAL_PORTAL_URL;
  }

  return LOCAL_PORTAL_URL;
}

export function getLoginUrl() {
  return "/sign-in";
}

export function getPortalUrl(options?: {
  returnTo?: string;
  user?: { name: string; email: string; clerkId?: string };
}) {
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
      if (options.user.clerkId) {
        url.searchParams.set("userClerkId", options.user.clerkId);
      }
    }
    return url.toString();
  } catch {
    return baseUrl;
  }
}

