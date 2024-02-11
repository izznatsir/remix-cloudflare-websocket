import * as http from "node:http";

import { type ServerBuild, createRequestHandler } from "@remix-run/server-runtime";
import * as vite from "vite";
import * as wrangler from "wrangler";
import * as ws from "ws";
import invariant from "./invariant";

let serverBuildId = "virtual:remix/server-build";
async function getRemixDevLoadContext() {
	let { bindings, caches, cf, ctx } = await wrangler.getBindingsProxy();
	return {
		env: bindings,
		caches,
		cf,
		...ctx,
	};
}

function plugin(): vite.Plugin {
	let socketMap = new Map<ws.WebSocket, import("@cloudflare/workers-types").WebSocket>();

	return {
		name: "vite-plugin-remix-workerd-websocket-proxy",
		enforce: "pre",
		async configureServer(viteDevServer) {
			if (!viteDevServer.httpServer || !(viteDevServer.httpServer instanceof http.Server))
				return;

			let wsServer = new ws.WebSocketServer({
				server: viteDevServer.httpServer,
			});

			wsServer.on("connection", async (ws, nodeRequest) => {
				let remixBuild = (await viteDevServer.ssrLoadModule(serverBuildId)) as ServerBuild;
				let remixHandler = createRequestHandler(remixBuild, "development");
				let remixLoadContext = await getRemixDevLoadContext();

				let request = fromNodeRequest(nodeRequest);
				let response = (await remixHandler(request, remixLoadContext)) as unknown as {
					status: number;
					webSocket: import("@cloudflare/workers-types").WebSocket;
				};

				if (response.status !== 101) {
					ws.close();
				} else {
					socketMap.set(ws, response.webSocket);
					response.webSocket.accept();

					ws.on("close", () => {
						response.webSocket.close();
						socketMap.delete(ws);
					});

					ws.on("message", (data) => {
						if (Array.isArray(data)) {
							for (let datum of data) {
								response.webSocket.send(datum);
							}
						} else {
							response.webSocket.send(data);
						}
					});

					ws.on("ping", (data) => {
						response.webSocket.send(data);
					});

					ws.on("pong", (data) => {
						response.webSocket.send(data);
					});

					response.webSocket.addEventListener("message", (e) => {
						ws.send(e.data);
					});
				}
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
function fromNodeRequest(nodeReq: http.IncomingMessage): Request {
	let origin =
		nodeReq.headers.origin && "null" !== nodeReq.headers.origin
			? nodeReq.headers.origin
			: `http://${nodeReq.headers.host}`;
	// Use `req.originalUrl` so Remix is aware of the full path
	invariant(nodeReq.url, "Expected `nodeReq.url` to be defined");
	let url = new URL(nodeReq.url, origin);
	let init: RequestInit = {
		method: nodeReq.method,
		headers: fromNodeHeaders(nodeReq.headers),
	};

	return new Request(url.href, init);
}

export default plugin;
