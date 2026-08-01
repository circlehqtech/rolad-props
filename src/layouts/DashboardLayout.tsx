import { useEffect, useState } from "react";
import Sidebar from "../shared/Sidebar";
import { Outlet } from "react-router-dom";
import Topbar from "../shared/Topbar";
import { useSidebarStore } from "../store/sidebar";

const DashboardLayout = () => {
  const { isOpen, open, close, toggle } = useSidebarStore();
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsedDefault, setIsCollapsedDefault] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1100); // md breakpoint - mobile/tablet
      // Between 768px and 1279px (md to lg), collapse by default
      // At 1280px+ (xl), expand by default
      setIsCollapsedDefault(width >= 1100 && width < 1280);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      close();
    } else if (isCollapsedDefault) {
      close(); // Collapsed by default at md/lg screens
    } else {
      open(); // Open by default at xl+ screens
    }
  }, [isMobile, isCollapsedDefault, open, close]);

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      close();
    }
  };

  return (
    <div className="app-shell flex h-screen w-screen overflow-hidden relative">
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 mlg:hidden"
          onClick={closeSidebarOnMobile}
        />
      )}

      <Sidebar isMobile={isMobile} />

      <div className="app-frame flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Topbar toggleSidebar={toggle} isMobile={isMobile} />
        <main className="app-workspace flex-1 overflow-auto px-4 py-5 sm:px-6 mlg:px-7 mlg:py-6">
          <div className="app-content mx-auto w-full max-w-[1680px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
