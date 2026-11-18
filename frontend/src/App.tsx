import { useAuth } from "./auth.tsx";
import { Layout } from "./components/Layout.tsx";
import { CreateTicketPage } from "./pages/CreateTicket.tsx";
import { EmployeeDashboard } from "./pages/EmployeeDashboard.tsx";
import { LoginPage } from "./pages/Login.tsx";
import { SupportDashboard } from "./pages/SupportDashboard.tsx";
import { TicketDetailsPage } from "./pages/TicketDetails.tsx";

function path(): string {
  return window.location.pathname;
}

export function App() {
  const { user, loading } = useAuth();
  const route = path();

  if (loading) {
    return <p className="page muted">Loading session…</p>;
  }

  if (!user) {
    if (route !== "/") {
      window.location.replace("/");
      return null;
    }
    return <LoginPage />;
  }

  if (route === "/") {
    window.location.replace(user.role === "support" ? "/support" : "/dashboard");
    return null;
  }

  if (user.role === "employee" && route === "/support") {
    window.location.replace("/dashboard");
    return null;
  }
  if (user.role === "support" && (route === "/dashboard" || route === "/tickets/new")) {
    window.location.replace("/support");
    return null;
  }

  let page = <p>Page not found.</p>;
  if (route === "/dashboard") page = <EmployeeDashboard />;
  if (route === "/support") page = <SupportDashboard />;
  if (route === "/tickets/new") page = <CreateTicketPage />;
  const details = route.match(/^\/tickets\/([^/]+)$/);
  if (details && details[1] !== "new") page = <TicketDetailsPage ticketId={details[1]} />;

  return <Layout>{page}</Layout>;
}
