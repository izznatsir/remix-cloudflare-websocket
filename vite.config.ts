import { vitePlugin as remix, cloudflarePreset as cloudflare } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { getBindingsProxy } from "wrangler";
import workerdWebsocketProxy from "./plugins/websocket-proxy";

export default defineConfig({
	plugins: [
		workerdWebsocketProxy(),
		remix({
			presets: [cloudflare(getBindingsProxy)],
		}),
		tsconfigPaths(),
	],
	server: {
		hmr: {
			port: 5174,
		},
	},
	ssr: {
		resolve: {
			externalConditions: ["workerd", "worker"],
		},
	},
});
