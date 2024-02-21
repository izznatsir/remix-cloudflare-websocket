interface Env {
	EchoDo: DurableObjectNamespace;
}

/**
 * no-op fetch handler as we only use the durable object from this service.
 */
export default {
	async fetch(_request: Request, _env: Env, _ctx: ExecutionContext) {
		return new Response(null, { status: 200 });
	},
};

export class EchoDo {
	#env: Env;
	#state: DurableObjectState;

	constructor(state: DurableObjectState, env: Env) {
		this.#env = env;
		this.#state = state;
	}

	async fetch(request: Request) {
		let url = new URL(request.url);

		switch (url.pathname) {
			case "/join": {
				let client = this.#join(request);

				return new Response(null, { status: 101, webSocket: client });
			}
			case "/broadcast": {
				break;
			}
			default: {
				return new Response(null, { status: 404 });
			}
		}
	}

	#join(request: Request) {
		let { 0: client, 1: server } = new WebSocketPair();

		this.#state.acceptWebSocket(server);

		return client;
	}

	async #broadcast() {}

	webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
		ws.send(message);
	}
}
