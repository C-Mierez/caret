import { cn } from "@lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const kbdVariants = cva(
	"pointer-events-none inline-flex w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted font-sans text-xs font-medium text-muted-foreground select-none in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10 [&_svg:not([class*='size-'])]:size-3",
	{
		variants: {
			variant: {
				outline: "border border-muted-foreground-alt",
			},
			size: {
				default: "h-5 px-1",
				sm: "h-5 px-2 py-3",
			},
		},
	},
);

function Kbd({
	variant,
	size = "default",
	className,
	...props
}: React.ComponentProps<"kbd"> & VariantProps<typeof kbdVariants>) {
	return (
		<kbd
			data-slot="kbd"
			className={cn(
				kbdVariants({
					variant,
					size,
					className,
				}),
			)}
			{...props}
		/>
	);
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<kbd
			data-slot="kbd-group"
			className={cn("inline-flex items-center gap-1", className)}
			{...props}
		/>
	);
}

export { Kbd, KbdGroup };
