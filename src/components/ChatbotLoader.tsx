import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router";
import type { RootState } from "../store";

const ALLOWED_USERS = ["HUYLQ", "HIEULV", "ANHNTQ"];
const SCRIPT_BASE = "https://dhtk.telesip.vn/public/chatbot/chat-widget.js";
const SCRIPT_ID = "cgv-telecom-chatbot-script";

const WIDGET_SELECTOR =
  '[id*="chat-widget"], [class*="chat-widget"], [id*="chatbot"], [class*="chatbot"]';

function ensureChatbotScriptLoaded() {
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  // cache-busting để chắc chắn browser fetch/execute lần đầu
  script.src = `${SCRIPT_BASE}?t=${Date.now()}`;
  script.async = true;
  script.setAttribute("data-api-base-url", "https://dhtk.telesip.vn/api/v1");
  script.setAttribute("data-faq-ai-config-id", "1");
  script.setAttribute("data-faq-suggestions-limit", "6");

  document.body.appendChild(script);
}

function setChatbotVisible(visible: boolean) {
  document.querySelectorAll<HTMLElement>(WIDGET_SELECTOR).forEach((el) => {
    el.style.display = visible ? "" : "none";
    if (visible) el.removeAttribute("aria-hidden");
    else el.setAttribute("aria-hidden", "true");
  });
}

export default function ChatbotLoader() {
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const location = useLocation();

  useEffect(() => {
    const isAllowed =
      Boolean(token) && Boolean(user?.sub) && ALLOWED_USERS.includes(user.sub);

    // Script chỉ load 1 lần duy nhất (khi user hợp lệ lần đầu tiên)
    if (isAllowed) ensureChatbotScriptLoaded();

    // Không remove DOM/widget: chỉ toggle hiển thị
    setChatbotVisible(isAllowed);

    // Nếu widget render muộn sau khi script load, vẫn đảm bảo toggle đúng
    const observer = new MutationObserver(() => {
      setChatbotVisible(isAllowed);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      // Khi unmount (vd logout chuyển sang public route) thì hide đi, không remove
      setChatbotVisible(false);
    };
  }, [location.pathname, token, user?.sub]);

  return null;
}
