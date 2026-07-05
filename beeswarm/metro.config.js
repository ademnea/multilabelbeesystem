const { getDefaultConfig } = require("expo/metro-config");
const http = require("http");
const https = require("https");

const config = getDefaultConfig(__dirname);

// ── Previously pointed at Railway — now proxying to local dev server ──────────
// const RAILWAY_API = "bsads-api-production.up.railway.app";

// const LOCAL_API_HOST = "localhost";
// const LOCAL_API_PORT = 8000;

const LOCAL_API_HOST = "196.43.168.57";
const LOCAL_API_PORT = 8085;
const USE_HTTPS = false; // Set to true when using HTTPS server

// Expo web (localhost:8081) cannot call the API directly — browser CORS blocks it.
// Proxy /api-proxy/* → local server so API calls are same-origin during dev.
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      const url = req.url ?? "";
      if (!url.startsWith("/api-proxy")) {
        return middleware(req, res, next);
      }

      const targetPath = url.replace(/^\/api-proxy/, "") || "/";
      const protocol = USE_HTTPS ? https : http;
      const proxyReq = protocol.request(
        {
          hostname: LOCAL_API_HOST,
          port: LOCAL_API_PORT,
          path: targetPath,
          method: req.method,
          headers: {
            "Content-Type": req.headers["content-type"] || "application/json",
            Accept: req.headers.accept || "application/json",
            ...(req.headers.authorization
              ? { Authorization: req.headers.authorization }
              : {}),
          },
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
          proxyRes.pipe(res);
        },
      );

      proxyReq.on("error", (err) => {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ detail: `Proxy error: ${err.message}` }));
      });

      req.pipe(proxyReq);
    };
  },
};

// Tell Metro exactly where to find maplibre-gl's JS entry point.
// Without this, Metro's resolver fails on the package because it
// contains non-JS files (CSS, workers) that confuse module resolution.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "maplibre-gl": require.resolve("maplibre-gl/dist/maplibre-gl.js"),
};

// Block only the non-JS files inside maplibre-gl that Metro cannot parse.
// Do NOT block the package root — HiveMap.web.tsx imports it directly.
const existingBlockList = config.resolver.blockList
  ? Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList]
  : [];

config.resolver.blockList = [
  ...existingBlockList,
  // CSS files — not valid JS modules
  /node_modules[/\\]maplibre-gl[/\\].*\.css$/,
  // Pre-built worker bundle — large, not needed by Metro
  /node_modules[/\\]maplibre-gl[/\\]dist[/\\]maplibre-gl-worker\.js$/,
];

module.exports = config;
