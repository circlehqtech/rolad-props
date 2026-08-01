import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSidebarStore } from "../store/sidebar";
import { SidebarRoutes } from "../routes/SidebarRoutes";
import Button from "../components/Button";
import FlatIcon from "../components/FlatIcon";

import { useAuthStore } from "../store/authStore";

interface SidebarProps {
  isMobile: boolean;
}

const hasPermissionForRoute = (
  role: string | undefined,
  path: string,
): boolean => {
  if (path === "/dashboard") return true;

  switch (role) {
    case "MD / CEO":
      return true;
    case "Administrator":
      return path !== "/accounts" && path !== "/marketing" && path !== "/sales";
    case "Accounts Lead":
    case "Account Officer":
    case "Accounts Officer":
      return path !== "/hr" && path !== "/marketing" && path !== "/management";
    case "Project Manager":
      return (
        path !== "/accounts" &&
        path !== "/hr" &&
        path !== "/marketing" &&
        path !== "/sales"
      );
    // case "HR Officer":
    //   return path === "/hr";
    case "Client Relations Officer":
      return (
        path !== "/hr" &&
        path !== "/management" &&
        path !== "/sales" &&
        path !== "/marketing"
      );
    case "Sales Officer":
      return path !== "/hr" && path !== "/management" && path !== "/marketing";
    case "Marketing Officer":
      return (
        path !== "/accounts" &&
        path !== "/hr" &&
        path !== "/management" &&
        path !== "/sales"
      );
    default:
      return false;
  }
};

const Sidebar = ({ isMobile }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, close } = useSidebarStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, logout } = useAuthStore();

  const handleNavClick = () => {
    if (isMobile) {
      close();
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate("/login");
  };

  // Filter out hidden routes and those without role permissions
  const visibleRoutes = SidebarRoutes.filter(
    (route) => !route.hidden && hasPermissionForRoute(user?.role, route.path),
  );

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`app-sidebar fixed mlg:relative inset-y-0 left-0 z-40 transform transition-all duration-300 ease-in-out
          flex flex-col h-full shrink-0 overflow-hidden
          ${isOpen || isMobile ? "w-[248px]" : "w-[78px]"}
          ${isOpen ? "translate-x-0" : "-translate-x-full mlg:translate-x-0"}
        `}
      >
        <div className={`sidebar-brand relative flex h-[74px] items-center gap-3 ${isOpen || isMobile ? "px-5" : "justify-center px-3"}`}>
          <div className="brand-mark" aria-hidden="true">
            <span>R</span>
          </div>
          {(isOpen || isMobile) && (
            <div className="min-w-0">
              <span className="block truncate text-[17px] font-extrabold tracking-[-0.035em] text-charcoal">
                ROLAD <span className="text-brand-teal">PROPS</span>
              </span>
              <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Property operations
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav relative flex-1 px-3 py-5 space-y-1 overflow-y-auto min-h-0">
          {(isOpen || isMobile) && (
            <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Portfolio workspace
            </p>
          )}
          {visibleRoutes.map((route) => {
            const isActive =
              route.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(route.path);
            let displayName = route.name;
            if (route.path === "/management") {
              if (user?.role === "MD / CEO") {
                displayName = "Admin";
              } else if (user?.role === "Administrator") {
                displayName = "Management";
              }
            }

            return (
              <NavLink
                key={route.path}
                to={route.path}
                onClick={handleNavClick}
                title={!isOpen && !isMobile ? displayName : undefined}
                className={`sidebar-link group flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[12px] font-semibold transition-all duration-150 ${
                  isActive
                    ? "is-active bg-[#edf6f7] text-brand-teal"
                    : "text-slate-600 hover:text-brand-teal hover:bg-[#f4f8f8]"
                } ${!isOpen && !isMobile ? "justify-center" : ""}`}
              >
                <span className={`sidebar-icon ${isActive ? "is-active" : ""}`}>
                  <FlatIcon
                    name={route.iconName}
                    className="text-[17px] transition-colors"
                  />
                </span>
                {(isOpen || isMobile) && <span>{displayName}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="relative px-3 pb-4 pt-3 shrink-0 flex flex-col border-t border-slate-100">
          {/* Add New Client Button (formerly New Request) */}
          {(user?.role === "Administrator" ||
            user?.role === "Client Relations Officer") && (
            <Button
              variant="primary"
              aria-label="Register client"
              title={!isOpen && !isMobile ? "Register client" : undefined}
              className={`${isOpen || isMobile ? "w-full mb-3" : "mx-auto mb-3 !h-10 !w-10 !p-0"}`}
              onClick={() => {
                handleNavClick();
                navigate("/intake");
              }}
            >
              {isOpen || isMobile ? (
                "Register Client"
              ) : (
                <FlatIcon name="user-add" className="text-[16px]" />
              )}
            </Button>
          )}

          {/* Logout Link */}
          <button
            onClick={() => setShowLogoutModal(true)}
            title={!isOpen && !isMobile ? "Sign out" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all w-full rounded-xl cursor-pointer ${!isOpen && !isMobile ? "justify-center" : ""}`}
          >
            <span className="sidebar-icon">
              <FlatIcon name="sign-out-alt" className="text-[16px]" />
            </span>
            {(isOpen || isMobile) && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-neutral-100">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">
              Sign Out
            </h3>
            <p className="text-neutral-500 text-sm mb-6">
              Are you sure you want to sign out of the Rolad Properties portal?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/95 rounded-lg transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
