/**
 * Cấu hình môi trường chạy app.
 *
 * - production: API prod + đăng nhập bình thường
 * - dev: API local/dev + bỏ login, dùng thẳng VITE_TOKEN_ACCESS
 */
export const APP_MODE = (import.meta.env.VITE_APP_MODE || "production").toLowerCase();

export const IS_DEV_MODE = APP_MODE === "dev";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (IS_DEV_MODE
    ? "http://103.216.124.57:8080"
    : "https://bookso.cgvtelecom.vn:8000")
).replace(/\/$/, "");

/** Access token dùng khi IS_DEV_MODE = true (bỏ bước đăng nhập). */
export const DEV_ACCESS_TOKEN = import.meta.env.VITE_TOKEN_ACCESS || "";
