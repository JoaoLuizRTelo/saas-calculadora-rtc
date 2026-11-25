import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// O navegador só fala com o Next; o Next repassa /backend/* ao back-end Spring Boot.
// Assim não há CORS e a URL do back-end não vaza para o cliente.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8081";

export default function config(fase: string): NextConfig {
  return {
    // Dev e produção usam pastas diferentes. Antes, `npm run dev` ou `npm run build` reescrevia a
    // pasta .next enquanto o "Sistema RTC.exe" (next start) a usava, e a tela em execução quebrava.
    distDir: fase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
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
}
