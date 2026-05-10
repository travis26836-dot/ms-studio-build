export function getLoginUrl() {
  return "/sign-in";
}

export function getPortalUrl(options?: { returnTo?: string }) {
  const baseUrl =
    (import.meta as { env?: { VITE_PORTAL_URL?: string } }).env
      ?.VITE_PORTAL_URL || "http://localhost:4000";

  if (!options?.returnTo) {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set("mainAppUrl", options.returnTo);
    return url.toString();
  } catch {
    return baseUrl;
  }
}
