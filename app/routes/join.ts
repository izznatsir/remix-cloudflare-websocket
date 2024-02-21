import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";

export async function loader({ context, request }: LoaderFunctionArgs) {
	let upgradeHeader = request.headers.get("upgrade");

	if (upgradeHeader !== "websocket")
		return json({ message: "Upgrade Required" }, { status: 426 });

	let { env } = context.cloudflare;

	let chatRoom = env.EchoDo.get(env.EchoDo.idFromName("echo"));

	return await chatRoom.fetch(request.url, request);
}
