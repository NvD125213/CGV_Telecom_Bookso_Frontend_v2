import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],

  server: {
    host: true, // Lắng nghe mọi địa chỉ IP
    port: 5173, // Đổi sang cổng public bạn muốn
    strictPort: true,
    open: false,
    allowedHosts: ["bookso.cgvtelecom.vn"], // Thêm tên miền của bạn vào đây
  },
});
