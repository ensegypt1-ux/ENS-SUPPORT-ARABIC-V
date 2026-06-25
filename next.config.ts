import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === "win32";

/**
 * Domains allowed to embed the chat widget (`/embed`) in an iframe.
 * Set EMBED_ALLOWED_ORIGINS to a comma/space separated list of origins,
 * e.g. "https://acme.com https://shop.acme.com". Unset = embeddable anywhere.
 */
const embedFrameAncestors = (() => {
  const raw = process.env.EMBED_ALLOWED_ORIGINS?.trim();
  if (!raw) return "*";
  const origins = raw
    .split(/[\s,]+/)
    .map((o) => o.trim())
    .filter(Boolean);
  return origins.length > 0 ? `'self' ${origins.join(" ")}` : "*";
})();

const nextConfig: NextConfig = {
  // Pin workspace root so Next/Turbopack do not resolve via a parent lockfile.
  turbopack: {
    root: projectRoot,
  },
  async redirects() {
    return [
      {
        source: "/192",
        destination: "/pwa-icons/192.png",
        permanent: false,
      },
      {
        source: "/512",
        destination: "/pwa-icons/512.png",
        permanent: false,
      },
      {
        source: "/pwa-icons/192",
        destination: "/pwa-icons/192.png",
        permanent: true,
      },
      {
        source: "/pwa-icons/512",
        destination: "/pwa-icons/512.png",
        permanent: true,
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      {
        source: "/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${embedFrameAncestors};`,
          },
        ],
      },
    ];

    if (process.env.NODE_ENV === "development") {
      securityHeaders.push({
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      });
    }

    return securityHeaders;
  },
  reactCompiler: true,
  experimental: {
    // Next.js 16 enables reactDebugChannel by default. When a document is served
    // with transferSize === 0 (SW/disk cache), createDebugChannel() calls
    // location.reload() if it cannot restore from sessionStorage — causing
    // infinite full-page reload loops on every panel route in dev.
    reactDebugChannel: false,
    // Windows: parallel workers can crash with exit code 3221226505
    // (STATUS_STACK_BUFFER_OVERRUN) during page-data collection.
    cpus: isWindows ? 1 : 4,
    workerThreads: false,
    serverActions: {
      bodySizeLimit: "20mb", // Increase from default 1MB to 20MB for file uploads
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.dev",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
