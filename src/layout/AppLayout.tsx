import { useEffect } from "react";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import Footer from "../components/footer/footer";

const CHATWOOT_BASE_URL = "https://devchat.telesip.vn";
const CHATWOOT_WEBSITE_TOKEN = "yHgjQd9cktTpBCxpiA2o1WYj";

let chatwootLoaded = false;

function loadChatwoot() {
  if (chatwootLoaded) return;
  chatwootLoaded = true;

  const w = window as typeof window & { chatwootSDK?: { run: (c: { websiteToken: string; baseUrl: string }) => void } };

  if (w.chatwootSDK) {
    w.chatwootSDK.run({ websiteToken: CHATWOOT_WEBSITE_TOKEN, baseUrl: CHATWOOT_BASE_URL });
    return;
  }

  const g = document.createElement("script");
  const s = document.getElementsByTagName("script")[0];
  g.src = `${CHATWOOT_BASE_URL}/packs/js/sdk.js`;
  g.async = true;
  s.parentNode?.insertBefore(g, s);

  g.onload = () => {
    const w2 = window as typeof window & { chatwootSDK?: { run: (c: { websiteToken: string; baseUrl: string }) => void } };
    w2.chatwootSDK?.run({ websiteToken: CHATWOOT_WEBSITE_TOKEN, baseUrl: CHATWOOT_BASE_URL });
  };
}

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  useEffect(() => {
    loadChatwoot();
  }, []);

  return (
    <div className="flex flex-col min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}>
        <AppHeader />
        <div className="p-2 md:p-6 flex-1">
          <Outlet />
        </div>
      </div>

      <Footer />
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
