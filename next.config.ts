import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir o dev server pelo IP do WSL (ex.: Chrome do Windows).
  allowedDevOrigins: ["10.255.255.254"],
  async headers() {
    return [
      {
        // O service worker nunca deve ficar em cache, senão atualizações demoram a chegar.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
