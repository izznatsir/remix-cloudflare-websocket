import * as React from "react";

export default function Component() {
	let socket = React.useRef<WebSocket>();
	let [messages, setMessages] = React.useState<Array<string>>([]);

	React.useEffect(() => {
		if (socket.current) return;

		let protocol = location.protocol === "http:" ? "ws:" : "wss:";
		try {
			socket.current = new WebSocket(`${protocol}//${location.host}/join`);
			socket.current.addEventListener("message", async (e) => {
				setMessages((messages) => [...messages, e.data]);
			});
		} catch (error) {
			console.error(error);
		}
	}, []);

	return (
		<div>
			<div>Echo</div>
			<button
				onClick={() => {
					if (!socket.current) return;

					socket.current.send("hello");
				}}
			>
				Hello!
			</button>
			<ul>
				{messages.map((message, index) => (
					<li key={index}>{message}</li>
				))}
			</ul>
		</div>
	);
}
