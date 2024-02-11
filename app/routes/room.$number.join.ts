import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";

export async function loader({ context, params, request }: LoaderFunctionArgs) {
	let upgradeHeader = request.headers.get("upgrade");

	if (upgradeHeader !== "websocket")
		return json({ message: "Upgrade Required" }, { status: 426 });

	request.headers.delete("origin");

	let { number: roomNumber } = params as { number: string };
	let url = new URL(request.url);
	url.pathname = "/join";

	let chatRoom = context.env.ChatRoomDo.get(context.env.ChatRoomDo.idFromName(roomNumber));

	return await chatRoom.fetch(`${url.origin}${url.pathname}`, request);
}
