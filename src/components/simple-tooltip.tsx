import type React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface Props {
	children: React.ReactNode;
	content?: {
		children?: React.ReactNode;
		contentProps?: React.ComponentProps<typeof TooltipContent>;
	};
	label?: {
		text: string;
		className?: string;
	};
}

export default function SimpleTooltip({ children, content, label }: Props) {
	return (
		<Tooltip>
			<TooltipTrigger>{children}</TooltipTrigger>
			<TooltipContent {...content?.contentProps}>
				{content?.children || (
					<span className={label?.className}>{label?.text}</span>
				)}
			</TooltipContent>
		</Tooltip>
	);
}
