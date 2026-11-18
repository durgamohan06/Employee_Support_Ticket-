import type { ReactNode } from "react";
import { useAuth } from "../auth.tsx";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const home = user?.role === "support" ? "/support" : "/dashboard";

  return (
    <div>
      <header className="app-header">
        <a className="brand" href={home}>
          Support Tickets
        </a>
        {user ? (
          <nav className="nav">
            <a href={home}>Dashboard</a>
            {user.role === "employee" ? <a href="/tickets/new">New ticket</a> : null}
            <span className="user-meta">
              {user.displayName} ({user.role})
            </span>
            <button className="link" type="button" onClick={() => void logout().then(() => (window.location.href = "/"))}>
              Log out
            </button>
          </nav>
        ) : null}
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
