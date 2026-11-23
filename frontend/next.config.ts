import type { NextConfig } from "next";

// O navegador só fala com o Next; o Next repassa /backend/* ao back-end Spring Boot.
// Assim não há CORS e a URL do back-end não vaza para o cliente.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8081";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
