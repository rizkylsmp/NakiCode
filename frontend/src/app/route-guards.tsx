import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";

type GuardProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: GuardProps) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.isAuthenticated) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate replace to={`/login?next=${encodeURIComponent(next)}`} />;
  }

  return children;
}

export function RequireAdmin({ children }: GuardProps) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.isAuthenticated) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate replace to={`/login?next=${encodeURIComponent(next)}`} />;
  }

  if (!auth.isAdmin) {
    return <Navigate replace to="/template" />;
  }

  return children;
}
