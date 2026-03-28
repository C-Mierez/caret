import "server-only";
import type React from "react";

export type ServerComponent<Props extends object = object> = (
	props: Props,
) => React.ReactNode | Promise<React.ReactNode>;

export type ServerHoc<Props extends object = object> = (
	Component: ServerComponent<Props>,
) => ServerComponent<Props>;
