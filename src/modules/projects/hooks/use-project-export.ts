import ky, { HTTPError } from "ky";
import { useCallback, useState } from "react";

interface ExportPayload {
	projectId: string;
	url: string;
	repositoryName: string;
	description?: string;
	visibility: "private" | "public";
}

interface ExportResponse {
	success: boolean;
	eventId: string;
}

interface ExportErrorResponse {
	error?: string;
	retryable?: boolean;
}

export default function useProjectExport() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const export_ = useCallback(async (payload: ExportPayload) => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await ky.post("/api/github/export", {
				json: payload,
			});

			const data = (await response.json()) as ExportResponse;
			setIsLoading(false);
			return data;
		} catch (err) {
			let message = "Failed to export project";

			if (err instanceof HTTPError) {
				try {
					const payload =
						(await err.response.json()) as ExportErrorResponse;
					message = payload.error || message;
				} catch {
					message = err.message;
				}
			} else if (err instanceof Error) {
				message = err.message;
			}

			setError(message);
			setIsLoading(false);
			throw new Error(message);
		}
	}, []);

	return {
		export: export_,
		isLoading,
		error,
	};
}
