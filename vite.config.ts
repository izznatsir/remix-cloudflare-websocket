import { vitePlugin as remix, cloudflareDevProxyVitePlugin as cloudflare } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import cloudflareWebsocket from "./plugins/websocket-proxy";

export default defineConfig({
	plugins: [cloudflare(), cloudflareWebsocket(), remix(), tsconfigPaths()],
});
