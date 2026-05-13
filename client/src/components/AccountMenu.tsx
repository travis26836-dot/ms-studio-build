import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getPortalUrl, getLoginUrl } from "@/const";
import { LogOut, Settings, User, HelpCircle, Globe } from "lucide-react";
import "../styles/account-menu.css";

export function AccountMenu() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
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
    // Clear auth and redirect to logout
    window.location.href = getLoginUrl();
  };

  const portalUrl = getPortalUrl({
    returnTo: window.location.origin,
    user: user ? { name: user.name, email: user.email } : undefined,
  });

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className="account-menu-trigger"
        onClick={() => setMenuOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <div className="account-avatar">
          {user?.name?.[0]?.toUpperCase() || "U"}
        </div>
        <span className="account-menu-info">
          <strong className="account-menu-name">{user?.name || "Account"}</strong>
          <span className="account-menu-email">{user?.email || ""}</span>
        </span>
      </button>

      {menuOpen && (
        <div
          className="account-menu-dropdown"
          role="menu"
          aria-label="Account navigation"
        >
          <div className="account-menu-header">
            <span className="account-menu-header-label">Studio</span>
          </div>

          <a
            href={portalUrl}
            role="menuitem"
            className="account-menu-link"
          >
            <Globe className="account-menu-link-icon" />
            Customer Portal
          </a>

          <a
            href="#"
            role="menuitem"
            className="account-menu-link"
            onClick={(e) => e.preventDefault()}
          >
            <User className="account-menu-link-icon" />
            Account Settings
          </a>

          <a
            href="#"
            role="menuitem"
            className="account-menu-link"
            onClick={(e) => e.preventDefault()}
          >
            <Settings className="account-menu-link-icon" />
            Preferences
          </a>

          <a
            href="#"
            role="menuitem"
            className="account-menu-link"
            onClick={(e) => e.preventDefault()}
          >
            <HelpCircle className="account-menu-link-icon" />
            Help & Support
          </a>

          <hr className="account-menu-divider" />

          <button
            type="button"
            role="menuitem"
            className="account-menu-logout"
            onClick={handleLogout}
            aria-label="Logout from studio"
          >
            <LogOut className="account-menu-logout-icon" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
