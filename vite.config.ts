import { vitePlugin as remix, cloudflareDevProxyVitePlugin as cloudflare } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [cloudflare(), remix(), tsconfigPaths()],
});
