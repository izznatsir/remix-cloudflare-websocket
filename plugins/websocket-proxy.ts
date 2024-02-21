import * as http from "node:http";

import { type ServerBuild, createRequestHandler } from "@remix-run/server-runtime";
import * as vite from "vite";
import * as wrangler from "wrangler";
import * as ws from "ws";

let serverBuildId = "virtual:remix/server-build";
async function getRemixDevLoadContext() {
	let { env, caches, cf, ctx } = await wrangler.getPlatformProxy();
	return {
		cloudflare: {
			env,
			caches,
			cf,
			ctx,
		},
	};
}

function plugin(): vite.PluginOption {
	return {
		name: "vite-plugin-workerd-websocket",
		enforce: "pre",
		config(config, env) {
			if (env.command === "build") return config;

			return {
				server: {
					hmr: {
						port: 4173,
					},
				},
			};
		},
		async configureServer(viteDevServer) {
			if (!viteDevServer.httpServer || !(viteDevServer.httpServer instanceof http.Server))
				return;

			let wsServer = new ws.WebSocketServer({
				server: viteDevServer.httpServer,
			});

			wsServer.on("connection", async (nodeWebSocket, nodeRequest) => {
				let remixBuild = (await viteDevServer.ssrLoadModule(serverBuildId)) as ServerBuild;
				let remixHandler = createRequestHandler(remixBuild, "development");
				let remixLoadContext = await getRemixDevLoadContext();

				let request = fromNodeRequest(nodeRequest);
				let response = (await remixHandler(request, remixLoadContext)) as unknown as {
					status: number;
					webSocket?: import("@cloudflare/workers-types").WebSocket;
				};

				if (response.status !== 101 || response.webSocket === undefined) {
					nodeWebSocket.close();
					return;
				}

				let workerdWebSocket = response.webSocket;

				workerdWebSocket.accept();

				let closedByClient = false;
				let closedByWorkerd = false;

				nodeWebSocket.on("close", () => {
					if (closedByWorkerd) {
						closedByWorkerd = false;
						viteDevServer.hot.send({
							type: "full-reload",
						});
						return;
					}

					closedByClient = true;
					workerdWebSocket.close();
				});

				nodeWebSocket.on("message", (data) => {
					if (Array.isArray(data)) {
						for (let datum of data) {
							workerdWebSocket.send(datum);
						}
					} else {
						workerdWebSocket.send(data);
					}
				});

				workerdWebSocket.addEventListener("close", () => {
					if (closedByClient) {
						closedByClient = false;
						return;
					}

					closedByWorkerd = true;
					nodeWebSocket.close();
				});

				workerdWebSocket.addEventListener("message", (e) => {
					nodeWebSocket.send(e.data);
				});
			});
		},
	};
}

function fromNodeHeaders(nodeHeaders: http.IncomingHttpHeaders): Headers {
	let headers = new Headers();

	for (let [key, values] of Object.entries(nodeHeaders)) {
		if (values) {
			if (Array.isArray(values)) {
				for (let value of values) {
					headers.append(key, value);
				}
			} else {
				headers.set(key, values);
			}
		}
	}

	return headers;
}

// Based on `createRemixRequest` in packages/remix-express/server.ts
function fromNodeRequest(nodeRequest: http.IncomingMessage): Request {
	let origin =
		nodeRequest.headers.origin && "null" !== nodeRequest.headers.origin
			? nodeRequest.headers.origin
			: `http://${nodeRequest.headers.host}`;

	if (!nodeRequest.url) {
		throw new Error("Expected `nodeRequest.url` to be defined");
	}

	let url = new URL(nodeRequest.url, origin);
	let init: RequestInit = {
		method: nodeRequest.method,
		headers: fromNodeHeaders(nodeRequest.headers),
	};

	return new Request(url.href, init);
}

export default plugin;
