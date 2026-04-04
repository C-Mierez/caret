import { useEffect, useRef } from "react";

export interface RequestWithId {
	id: number;
}

export default function useRequestConsumer<T extends RequestWithId>(
	request: T | undefined,
	onRequest: (request: T) => void,
) {
	const handledRequestIdRef = useRef(0);

	useEffect(() => {
		if (!request) return;

		if (request.id === handledRequestIdRef.current) {
			return;
		}

		handledRequestIdRef.current = request.id;
		onRequest(request);
	}, [request, onRequest]);
}
