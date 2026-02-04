import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import DesktopNavbar from "./DesktopNavbar";
import MobileBottomNav from "./MobileBottomNav";
import Footer from "../Footer.jsx"; // Assuming Footer is in src/components

const Layout = () => {
  const location = useLocation();
  const hideFooter = location.pathname === "/signin";

  return (
    <>
      <DesktopNavbar />
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 pb-16 md:pb-0">
          <Outlet />
        </main>
        {!hideFooter && <div className="hidden md:block"><Footer /></div>}
        {/* On mobile, we might not want the big footer, or maybe a simplified one.
            For now, let's keep it but ensure it doesn't overlap the sticky nav significantly
            (handled by pb-16 above) */}
        {!hideFooter && <div className="md:hidden pb-20"><Footer /></div>}
      </div>
      <MobileBottomNav />
    </>
  );
};

export default Layout;
