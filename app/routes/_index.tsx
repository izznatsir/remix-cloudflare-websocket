import * as React from "react";

let textDecoder = new TextDecoder("utf-8");

export default function Component() {
	let socket = React.useRef<WebSocket>();

	React.useEffect(() => {
		if (socket.current) return;

		let protocol = location.protocol === "http:" ? "ws:" : "wss:";
		try {
			socket.current = new WebSocket(`${protocol}//${location.host}/room/1/join`);
			socket.current.addEventListener("message", async (e) => {
				console.log(textDecoder.decode(await (e.data as Blob).arrayBuffer()));
			});
		} catch (error) {
			console.error(error);
		}
	}, []);

	return (
		<div>
			<div>Chat Room</div>
			<button
				onClick={() => {
					if (!socket.current) return;

					socket.current.send("hello");
				}}
			>
				Send
			</button>
		</div>
	);
}
