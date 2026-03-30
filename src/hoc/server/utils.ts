import "server-only";

import { URLs } from "@lib/urls";
import { redirect } from "next/navigation";
import type { ServerHoc } from "./types";

export function composeServerHocs<Props extends object = object>(
	...hocs: ServerHoc<Props>[]
): ServerHoc<Props> {
	return (Component) => hocs.reduceRight((Acc, hoc) => hoc(Acc), Component);
}

export async function safeServerQuery<T>(
	query: () => Promise<T>,
	errorMessage: string,
): Promise<T> {
	try {
		return await query();
	} catch (error) {
		console.error(errorMessage, error);
		redirect(URLs.root);
	}
}
