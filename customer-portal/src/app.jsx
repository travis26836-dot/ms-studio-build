import { useEffect, useMemo, useRef, useState } from "react";

const PORTAL_IDENTITY_KEY = "ms.portal.identity.v1";
const DEFAULT_MAIN_APP_URL = "http://localhost:3002";

function getMainAppUrl() {
  return import.meta.env.VITE_MAIN_APP_URL || DEFAULT_MAIN_APP_URL;
}

function getMainAppLoginUrl() {
  return (
    import.meta.env.VITE_MAIN_APP_LOGIN_URL || `${getMainAppUrl()}/logout`
  );
}

function getPortalIdentity() {
  const fallback = {
    name: "Client User",
    email: "client@portal.local",
  };

  if (typeof window === "undefined") {
    return fallback;
  }

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
                <a href="#" role="menuitem" className="account-menu-link" onClick={event => event.preventDefault()}>
                  Settings
                </a>
                <a href="#" role="menuitem" className="account-menu-link" onClick={event => event.preventDefault()}>
                  Theme
                </a>
                <a href="#" role="menuitem" className="account-menu-link" onClick={event => event.preventDefault()}>
                  Plans and Pricing
                </a>
                <a href="#" role="menuitem" className="account-menu-link" onClick={event => event.preventDefault()}>
                  Purchase History
                </a>

                <hr className="account-menu-divider" />

                <button
                  type="button"
                  role="menuitem"
                  className="account-menu-logout"
                  onClick={handleLogout}
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
