import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  experimental: {
    serverActions: {
      // Codespaces forwards development requests with Origin: localhost:3000.
      // Do not add this extra origin in production.
      allowedOrigins:
        process.env.NODE_ENV === "development" ? ["localhost:3000"] : [],

      // The application still validates individual poster files at 10 MB.
      // The additional space accommodates multipart request overhead.
      bodySizeLimit: "12mb",
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
