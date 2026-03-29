import type { UsePaginatedQueryResult } from "convex/react";
import { Loader2Icon } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
	paginatedResult: UsePaginatedQueryResult<unknown>;
	itemsPerPage: number;
	totalItems?: number;
}

export default function InfiniteScroller({
	paginatedResult: { loadMore, status, results },
	itemsPerPage,
	totalItems,
}: Props) {
	const safeItemsPerPage = Math.max(1, itemsPerPage);
	const currentPage = Math.max(
		1,
		Math.ceil(results.length / safeItemsPerPage),
	);
	const maxPages =
		totalItems === undefined
			? null
			: Math.max(1, Math.ceil(totalItems / safeItemsPerPage));

	return (
		<div className="w-full grid place-items-center gap-2 py-3">
			<Button
				type="button"
				variant={"outline"}
				className="text-muted-foreground"
				onClick={() => {
					loadMore(itemsPerPage);
				}}
				disabled={
					status === "LoadingMore" ||
					status === "LoadingFirstPage" ||
					status === "Exhausted"
				}
			>
				{status === "Exhausted" && <p>Load more</p>}
				{status === "CanLoadMore" && <p>Load more</p>}
				{(status === "LoadingFirstPage" ||
					status === "LoadingMore") && (
					<Loader2Icon className="animate-spin" />
				)}
			</Button>

			<p className="text-sm text-muted-foreground-alt">
				{maxPages === null
					? ""
					: `${Math.min(currentPage, maxPages)} of ${maxPages}`}
			</p>
		</div>
	);
}
