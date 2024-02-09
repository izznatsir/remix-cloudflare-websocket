import { type LoaderFunctionArgs } from "@remix-run/cloudflare";

export async function loader({ params, request }: LoaderFunctionArgs) {
	console.log("in");

	let { number } = params as { number: string };
	console.log(`room #${number}`, request.headers.keys(), request.headers.values());

	return null;
}
