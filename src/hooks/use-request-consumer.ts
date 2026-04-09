import { useEffect, useRef } from "react";

export interface RequestWithId {
	id: number;
}

interface UseRequestConsumerOptions {
	replayOnMount?: boolean;
}

export default function useRequestConsumer<T extends RequestWithId>(
	request: T | undefined,
	onRequest: (request: T) => void,
	options?: UseRequestConsumerOptions,
) {
	const { replayOnMount = false } = options ?? {};
	const handledRequestIdRef = useRef<number | undefined>(undefined);
	const mountedRef = useRef(false);
	const initialRequestIdRef = useRef<number | undefined>(request?.id);

	useEffect(() => {
		if (!mountedRef.current) {
			mountedRef.current = true;
		}

		if (!request) return;

		const isInitialMountedRequest =
			request.id === initialRequestIdRef.current;

		if (
			handledRequestIdRef.current === undefined &&
			isInitialMountedRequest &&
			!replayOnMount
		) {
			handledRequestIdRef.current = request.id;
			return;
		}

		if (request.id === handledRequestIdRef.current) {
			return;
		}

		handledRequestIdRef.current = request.id;
		onRequest(request);
	}, [request, onRequest, replayOnMount]);
}
