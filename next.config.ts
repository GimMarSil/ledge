import { withSentryConfig } from "@sentry/nextjs"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  eslint: {
    dirs: ["app", "components", "lib", "models", "ai", "forms"],
  },
  images: {
    remotePatterns: [],
  },
  // pdfjs-dist + @napi-rs/canvas are server-only and ship a .node native
  // binary. Without listing them as external, webpack tries to bundle the
  // binary into the server actions chunk and the build fails with
  // "Module parse failed: Unexpected character '\\0'". They run on the
  // node side via require() at runtime instead.
  // zxing-wasm ships a .wasm binary it loads via Emscripten's locateFile;
  // bundling it through webpack mangles the binary lookup, so externalize.
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist", "zxing-wasm"],
  experimental: {
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ]
  },
}

const isSentryEnabled = process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT

export default isSentryEnabled
  ? withSentryConfig(nextConfig, {
      silent: !process.env.CI,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      disableLogger: true,
      widenClientFileUpload: true,
      tunnelRoute: "/monitoring",
    })
  : nextConfig
