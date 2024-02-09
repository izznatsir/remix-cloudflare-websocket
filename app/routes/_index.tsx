import * as React from "react";

export default function Component() {
	let socket = React.useRef<WebSocket>();

	React.useEffect(() => {
		if (socket.current) return;

		console.log("socket", socket.current);

		let protocol = location.protocol === "http:" ? "ws:" : "wss:";
		socket.current = new WebSocket(`${protocol}//${location.host}/room/1/join`);
	}, []);

	return <div>Chat Room</div>;
}
