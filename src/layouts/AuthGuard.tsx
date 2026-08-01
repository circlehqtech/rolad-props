import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, accessToken, isHydrating, user } = useAuthStore();

  if (!isAuthenticated && !accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (isHydrating || (accessToken && !user)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream/30">
        <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-muted-gray text-xs font-medium">Authenticating session...</p>
      </div>
    );
  }

  return <>{children}</>;
}
