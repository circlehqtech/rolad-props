import { lazy } from "react";
import type { SidebarRoute } from "../types/extra";

const Dashboard = lazy(() => import("../pages/dashboard"));
const Clients = lazy(() => import("../pages/clients"));
const Accounts = lazy(() => import("../pages/accounts"));
const Projects = lazy(() => import("../pages/projects"));
// const HR = lazy(() => import("../pages/hr"));
const Management = lazy(() => import("../pages/management"));
const SalesDashboard = lazy(() => import("../pages/sales"));
const MarketingDashboard = lazy(() => import("../pages/marketing"));
// const Messages = lazy(() => import("../pages/messages"));

export const SidebarRoutes: SidebarRoute[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    iconName: "apps",
    component: Dashboard,
  },
  {
    name: "Clients",
    path: "/clients",
    iconName: "users-alt",
    component: Clients,
  },
  {
    name: "Accounts",
    path: "/accounts",
    iconName: "wallet",
    component: Accounts,
  },
  {
    name: "Projects",
    path: "/projects",
    iconName: "building",
    component: Projects,
  },
  // {
  //   name: "HR",
  //   path: "/hr",
  //   icon: UserCheck,
  //   component: HR,
  // },
  {
    name: "Approvals",
    path: "/management",
    iconName: "shield-check",
    component: Management,
  },
  {
    name: "Sales",
    path: "/sales",
    iconName: "chart-histogram",
    component: SalesDashboard,
  },
  {
    name: "Marketing",
    path: "/marketing",
    iconName: "megaphone",
    component: MarketingDashboard,
  },
  // {
  //   name: "Messages",
  //   path: "/messages",
  //   icon: MessageSquare,
  //   component: Messages,
  // },
];
