import { useEffect } from "react";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import Footer from "../components/footer/footer";
import ChatbotLoader from "../components/ChatbotLoader";

const CHATWOOT_BASE_URL = "https://devchat.telesip.vn";
const CHATWOOT_WEBSITE_TOKEN = "yHgjQd9cktTpBCxpiA2o1WYj";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  useEffect(() => {
    // Nếu đã load rồi thì không load lại
    if ((window as any).chatwootSDK) {
      (window as any).chatwootSDK.run({
        websiteToken: CHATWOOT_WEBSITE_TOKEN,
        baseUrl: CHATWOOT_BASE_URL,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `${CHATWOOT_BASE_URL}/packs/js/sdk.js`;
    script.async = true;

    script.onload = () => {
      (window as any).chatwootSDK.run({
        websiteToken: CHATWOOT_WEBSITE_TOKEN,
        baseUrl: CHATWOOT_BASE_URL,
      });
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
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
      <ChatbotLoader />
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
