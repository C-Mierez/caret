import type { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import type React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface Props extends TooltipPrimitive.Trigger.Props {
	children: React.ReactNode;
	label?: {
		text: string;
		className?: string;
	};
}

export default function SimpleTooltip({
	children,
	type = "button",
	label,
	...props
}: Props) {
	return (
		<Tooltip>
			<TooltipTrigger type={type} {...props}>
				{children}
			</TooltipTrigger>
			{label?.text && (
				<TooltipContent>
					<span className={label?.className}>{label?.text}</span>
				</TooltipContent>
			)}
		</Tooltip>
	);
}
