import "server-only";
import type { ServerHoc } from "./types";

export function composeServerHocs<Props extends object = object>(
	...hocs: ServerHoc<Props>[]
): ServerHoc<Props> {
	return (Component) => hocs.reduceRight((Acc, hoc) => hoc(Acc), Component);
}
