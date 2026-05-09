import ky from "ky";
import { useCallback, useState } from "react";

interface ImportPayload {
	url: string;
}

interface ImportResponse {
	success: boolean;
	eventId: string;
	projectId: string;
}

export default function useProjectImport() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const import_ = useCallback(async (payload: ImportPayload) => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await ky.post("/api/github/import", {
				json: payload,
			});

			const data = (await response.json()) as ImportResponse;
			setIsLoading(false);
			return data;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to import project";
			setError(message);
			setIsLoading(false);
			throw err;
		}
	}, []);

	return {
		import: import_,
		isLoading,
		error,
	};
}
