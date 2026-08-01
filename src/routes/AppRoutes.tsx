import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { SidebarRoutes } from "./SidebarRoutes";
import DashboardLayout from "../layouts/DashboardLayout";
import AuthGuard from "../layouts/AuthGuard";
import { useAuthStore } from "../store/authStore";
import { Lock } from "lucide-react";

const Login = lazy(() => import("../pages/login"));
const ClientProfile = lazy(() => import("../pages/clients/ClientProfile"));
const Intake = lazy(() => import("../pages/intake"));
const RevenueSources = lazy(() => import("../pages/sales/RevenueSources"));
const NotFound = lazy(() => import("../pages/notFound"));

// Allowed roles map matching the specifications matrix
const ROUTE_ROLE_LIMITS: Record<string, string[]> = {
  "/dashboard": [
    "MD / CEO",
    "Administrator",
    "Accounts Lead",
    "Project Manager",
    "Client Relations Officer",
    "Sales Officer",
    "Marketing Officer",
  ],
  "/clients": [
    "MD / CEO",
    "Administrator",
    "Accounts Lead",
    "Project Manager",
    "Client Relations Officer",
    "Sales Officer",
    "Marketing Officer",
  ],
  "/accounts": [
    "MD / CEO",
    "Accounts Lead",
    "Client Relations Officer",
    "Sales Officer",
  ], // Administrator completely cut from Accounts
  "/projects": [
    "MD / CEO",
    "Administrator",
    "Accounts Lead",
    "Project Manager",
    "Client Relations Officer",
    "Sales Officer",
    "Marketing Officer",
  ],
  // "/hr": ["MD / CEO", "Administrator", "HR Officer"],
  "/management": [
    "MD / CEO",
    "Administrator",
    "Project Manager",
  ],
  "/intake": [
    "MD / CEO",
    "Administrator",
    "Client Relations Officer",
    "Sales Officer",
  ],
  "/clients/:id": [
    "MD / CEO",
    "Administrator",
    "Accounts Lead",
    "Project Manager",
    "Client Relations Officer",
    "Sales Officer",
    "Marketing Officer",
  ],
  "/sales": ["MD / CEO", "Accounts Lead", "Sales Officer"], // Administrator removed per §6 matrix
  "/sales/release-payout": ["MD / CEO", "Accounts Lead", "Sales Officer"],
  "/sales/revenue-sources": ["MD / CEO", "Accounts Lead", "Sales Officer"],
  "/marketing": ["MD / CEO", "Marketing Officer"], // Administrator completely cut from Marketing
  "/marketing/leads": ["MD / CEO", "Marketing Officer"],
  "/messages": [], // Disabled for all roles for now
  "/clients/:id/campaign": [
    "MD / CEO",
    "Administrator",
    "Client Relations Officer",
    "Sales Officer",
  ],
  "/clients/:id/messages": [
    "MD / CEO",
    "Administrator",
    "Accounts Lead",
    "Client Relations Officer",
    "Sales Officer",
  ],
  "/accounts/audits": ["MD / CEO", "Accounts Lead"],
};

interface RoleGuardProps {
  path: string;
  children: React.ReactNode;
}

const RoleGuard = ({ path, children }: RoleGuardProps) => {
  const { user, isHydrating, accessToken } = useAuthStore();

  // If session is hydrating profile data, show subtle loader instead of Access Restricted
  if (isHydrating || (accessToken && !user)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center select-none">
        <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-muted-gray text-xs font-medium">
          Verifying access permissions...
        </p>
      </div>
    );
  }

  const role = user?.role || "";
  const allowedRoles = ROUTE_ROLE_LIMITS[path] || [];

  if (!allowedRoles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center select-none">
        <div className="w-16 h-16 rounded-full bg-status-missed/10 flex items-center justify-center text-status-missed mb-4 border border-status-missed/20 animate-pulse">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-charcoal">
          Access Restricted
        </h1>
        <p className="text-muted-gray text-xs mt-2 max-w-sm leading-normal">
          Your profile ({role || "Guest"}) does not possess structural access
          authorization for the {path.split("/")[1].toUpperCase()} console.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth routes - no layout */}
      <Route
        path="/login"
        element={
          <Suspense
            fallback={<div className="p-8 font-medium">Loading...</div>}
          >
            <Login />
          </Suspense>
        }
      />

      {/* Protected dashboard routes */}
      <Route
        element={
          <AuthGuard>
            <DashboardLayout />
          </AuthGuard>
        }
      >
        {/* Dynamic Sidebar Routes */}
        {SidebarRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <RoleGuard path={route.path}>
                <route.component />
              </RoleGuard>
            }
          />
        ))}

        {/* Dynamic Client Profile Page Route */}
        <Route
          path="/clients/:id"
          element={
            <RoleGuard path="/clients/:id">
              <Suspense fallback={<div className="p-8">Loading Client...</div>}>
                <ClientProfile />
              </Suspense>
            </RoleGuard>
          }
        />

        {/* Client Intake Utilities Route */}
        <Route
          path="/intake"
          element={
            <RoleGuard path="/intake">
              <Suspense fallback={<div className="p-8">Loading Intake...</div>}>
                <Intake />
              </Suspense>
            </RoleGuard>
          }
        />

        {/* Revenue Sources Executive Route */}
        <Route
          path="/sales/revenue-sources"
          element={
            <RoleGuard path="/sales/revenue-sources">
              <Suspense
                fallback={<div className="p-8">Loading Revenue Sources...</div>}
              >
                <RevenueSources />
              </Suspense>
            </RoleGuard>
          }
        />

        {/* Wildcard 404 Route inside DashboardLayout */}
        <Route
          path="*"
          element={
            <Suspense fallback={<div className="p-8">Loading...</div>}>
              <NotFound />
            </Suspense>
          }
        />
      </Route>
      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Top-level Wildcard 404 Route */}
      <Route
        path="*"
        element={
          <Suspense fallback={<div className="p-8">Loading...</div>}>
            <NotFound />
          </Suspense>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
