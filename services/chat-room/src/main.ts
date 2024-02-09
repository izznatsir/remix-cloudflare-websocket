interface Env {
	ChatRoomDo: DurableObjectNamespace;
}

/**
 * no-op fetch handler as we only use the durable object from this service.
 */
export default {
	async fetch(_request: Request, _env: Env, _ctx: ExecutionContext) {
		return new Response(null, { status: 200 });
	},
};

export class ChatRoomDo {
	#env: Env;
	#state: DurableObjectState;

	constructor(state: DurableObjectState, env: Env) {
		this.#env = env;
		this.#state = state;
	}

	async fetch(request: Request) {
		let url = new URL(request.url);

		switch (url.pathname) {
			case "/connect": {
				let client = this.#connect(request);

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

	#connect(request: Request) {
		let { 0: server, 1: client } = new WebSocketPair();

		this.#state.acceptWebSocket(server);

		return client;
	}

	async #broadcast() {}
}
