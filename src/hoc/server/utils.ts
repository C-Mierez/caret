import "server-only";

import { getOrRedirectConvexToken } from "@lib/server-auth";
import { URLs } from "@lib/urls";
import { redirect } from "next/navigation";
import type { ServerComponent, ServerHoc } from "./types";

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

interface CreateProtectedDataHocOptions<Props extends object, Data> {
	errorMessage: string;
	getData: (props: Props, token: string) => Promise<Data>;
	render: (args: {
		props: Props;
		data: Data;
		Component: ServerComponent<Props>;
	}) => React.ReactNode;
}

export function createProtectedDataHoc<Props extends object, Data>({
	errorMessage,
	getData,
	render,
}: CreateProtectedDataHocOptions<Props, Data>): ServerHoc<Props> {
	return (Component) =>
		async function WithProtectedData(props: Props) {
			const token = await getOrRedirectConvexToken();
			const data = await safeServerQuery(
				() => getData(props, token),
				errorMessage,
			);

			return render({ props, data, Component });
		};
}
