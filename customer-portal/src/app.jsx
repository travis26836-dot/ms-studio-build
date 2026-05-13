import { useEffect, useMemo, useRef, useState } from "react";

const PORTAL_IDENTITY_KEY = "ms.portal.identity.v1";
const MAIN_APP_URL_QUERY_PARAM = "mainAppUrl";
const MAIN_APP_URL_STORAGE_KEY = "ms.portal.mainAppUrl.v1";
const DEFAULT_MAIN_APP_URL = "/";

function isValidAbsoluteUrl(raw) {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getMainAppUrlFromQuery() {
  if (typeof window === "undefined") {
    return null;
  }

  const value = new URLSearchParams(window.location.search).get(
    MAIN_APP_URL_QUERY_PARAM
  );
  if (!value || !isValidAbsoluteUrl(value)) {
    return null;
  }

  return value;
}

function getMainAppUrlFromReferrer() {
  if (typeof document === "undefined" || !document.referrer) {
    return null;
  }

  if (!isValidAbsoluteUrl(document.referrer)) {
    return null;
  }

  return new URL(document.referrer).origin;
}

function getMainAppUrlFromStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(MAIN_APP_URL_STORAGE_KEY);
    if (!value || !isValidAbsoluteUrl(value)) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

function rememberMainAppUrl(value) {
  if (typeof window === "undefined") {
    return;
  }

  if (!value || !isValidAbsoluteUrl(value)) {
    return;
  }

  try {
    window.localStorage.setItem(MAIN_APP_URL_STORAGE_KEY, value);
  } catch {
    // Keep navigation working even if persistence is blocked.
  }
}

function getMainAppUrl() {
  const resolved =
    import.meta.env.VITE_MAIN_APP_URL ||
    getMainAppUrlFromQuery() ||
    getMainAppUrlFromReferrer() ||
    getMainAppUrlFromStorage() ||
    getRuntimeMainAppUrl();

  rememberMainAppUrl(resolved);
  return resolved;
}

function getRuntimeMainAppUrl() {
  if (typeof window === "undefined") {
    return DEFAULT_MAIN_APP_URL;
  }

  // At runtime, derive main app from portal's location
  // Main app typically runs on a port one lower than portal: if portal is 3003, main is 3002, etc.
  const portalPort = window.location.port;
  if (!portalPort) {
    return window.location.origin;
  }

  const portalPortNum = parseInt(portalPort, 10);
  const mainAppPortNum = portalPortNum - 1; // Main app runs on previous port

  return `${window.location.protocol}//${window.location.hostname}:${mainAppPortNum}`;
}

function getMainAppLoginUrl() {
  const mainAppUrl = getMainAppUrl();
  return import.meta.env.VITE_MAIN_APP_LOGIN_URL || `${mainAppUrl}/logout`;
}

function getPortalIdentity() {
  const fallback = {
    name: "Client User",
    email: "client@portal.local",
  };

  if (typeof window === "undefined") {
    return fallback;
  }

  // First, try to get from URL parameters (passed from main app)
  try {
    const params = new URLSearchParams(window.location.search);
    const userName = params.get("userName");
    const userEmail = params.get("userEmail");

    if (userName && userEmail) {
      return { name: userName, email: userEmail };
    }
  } catch {
    // Continue to localStorage fallback
  }

  // Fall back to localStorage (for when portal is accessed directly)
  try {
    const raw = window.localStorage.getItem(PORTAL_IDENTITY_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    const name =
      typeof parsed?.name === "string" && parsed.name.trim()
        ? parsed.name.trim()
        : fallback.name;
    const email =
      typeof parsed?.email === "string" && parsed.email.trim()
        ? parsed.email.trim()
        : fallback.email;

    return { name, email };
  } catch {
    return fallback;
  }
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const identity = useMemo(() => getPortalIdentity(), []);

  useEffect(() => {
    const onPointerDown = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = event => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(PORTAL_IDENTITY_KEY);
    } catch {
      // Continue logout flow even if storage removal fails.
    }

    window.location.href = getMainAppLoginUrl();
  };

  return (
    <div className="portal-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <a href={getMainAppUrl()} className="site-logo" aria-label="Open ManuScript Studio home">
            <div className="site-logo-icon">
              <img src="/icon-192.png" alt="ManuScript Studio logo" />
            </div>
            <span className="site-logo-wordmark">ManuScript Studio</span>
          </a>

          <div className="account-menu" ref={menuRef}>
            <button
              type="button"
              className="account-menu-trigger"
              onClick={() => setMenuOpen(open => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="account-avatar" aria-hidden="true">
                {identity.name.trim()[0]?.toUpperCase() || "?"}
              </span>
              <span className="account-menu-info">
                <strong className="account-menu-name">{identity.name}</strong>
                <span className="account-menu-email">{identity.email}</span>
              </span>
            </button>

            {menuOpen ? (
              <div className="account-menu-dropdown" role="menu" aria-label="Customer account navigation">
                <div className="account-menu-header">
                  <span className="account-menu-header-label">Portal</span>
                </div>

                <a href="#" role="menuitem" className="account-menu-link" onClick={event => event.preventDefault()}>
                  Account
                </a>
                <a href="#" role="menuitem" className="account-menu-link" onClick={event => event.preventDefault()}>
                  Settings
                </a>
                <a href="#" role="menuitem" className="account-menu-link" onClick={event => event.preventDefault()}>
                  Plans & Pricing
                </a>
                <a href="#" role="menuitem" className="account-menu-link" onClick={event => event.preventDefault()}>
                  Purchase History
                </a>
                <a href="#" role="menuitem" className="account-menu-link" onClick={event => event.preventDefault()}>
                  Invoices
                </a>

                <hr className="account-menu-divider" />

                <button
                  type="button"
                  role="menuitem"
                  className="account-menu-logout"
                  onClick={handleLogout}
                  aria-label="Logout from customer portal"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
    </div>
  );
}
