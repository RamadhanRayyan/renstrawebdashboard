import { useEffect } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

const guestRoutes = new Set(["/", "/guest-dashboard", "/guest-table"]);
const adminRoutes = new Set(["/admin-dashboard", "/admin-progress", "/admin"]);

export function AuthRoleRedirect() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading || location.pathname === "/login") return;

    if (user && guestRoutes.has(location.pathname)) {
      navigate({ to: "/admin-dashboard", replace: true });
      return;
    }

    if (!user && adminRoutes.has(location.pathname)) {
      navigate({ to: "/guest-dashboard", replace: true });
    }
  }, [isLoading, location.pathname, navigate, user]);

  return null;
}
