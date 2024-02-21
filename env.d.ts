/// <reference types="@remix-run/cloudflare" />
/// <reference types="vite/client" />

import { type PlatformProxy } from "wrangler";

interface Env {
	EchoDo: DurableObjectNamespace;
}

type Cloudflare = Omit<PlatformProxy<Env>, "dispose">;

declare module "@remix-run/cloudflare" {
	interface AppLoadContext {
		cloudflare: Cloudflare;
	}
}
