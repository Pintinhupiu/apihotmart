import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * googleapis usa módulos nativos do Node.js que precisam rodar
   * fora do bundle do Next.js no edge runtime da Vercel.
   */
  serverExternalPackages: ["googleapis"],
};

export default nextConfig;
