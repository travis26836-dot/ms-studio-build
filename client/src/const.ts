export function getLoginUrl() {
  return "/sign-in";
}

export function getPortalUrl() {
  return (
    (import.meta as { env?: { VITE_PORTAL_URL?: string } }).env
      ?.VITE_PORTAL_URL || "http://localhost:4000"
  );
}
