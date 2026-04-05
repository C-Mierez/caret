import { useEffect, useRef } from "react";

export interface RequestWithId {
	id: number;
}

export default function useRequestConsumer<T extends RequestWithId>(
	request: T | undefined,
	onRequest: (request: T) => void,
) {
	const handledRequestIdRef = useRef<number | undefined>(undefined);

	useEffect(() => {
		if (!request) return;

		if (handledRequestIdRef.current === undefined) {
			handledRequestIdRef.current = request.id;
			return;
		}

		if (request.id === handledRequestIdRef.current) {
			return;
		}

		handledRequestIdRef.current = request.id;
		onRequest(request);
	}, [request, onRequest]);
}
