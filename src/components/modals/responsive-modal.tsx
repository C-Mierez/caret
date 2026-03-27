import { useIsMobile } from "@hooks/use-mobile";
import type { ModalProps } from "@hooks/use-modal";

import { Dialog, DialogContent } from "../ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";

interface ResponsiveModalProps extends ModalProps {
	children: React.ReactNode;
	header?: React.ReactNode;
	className?: string;
	showCloseButton?: boolean;
}

export default function ResponsiveModal({
	children,
	header,
	className,
	showCloseButton = false,
	modal = true,
	isOpen,
	onOpenChange,
}: ResponsiveModalProps) {
	const isMobile = useIsMobile();

	if (isMobile)
		return (
			<Drawer open={isOpen} onOpenChange={onOpenChange} modal={modal}>
				<DrawerContent className={className}>
					{!!header && (
						<DrawerHeader>
							<DrawerTitle>{header}</DrawerTitle>
						</DrawerHeader>
					)}
					{children}
				</DrawerContent>
			</Drawer>
		);

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange} modal={modal}>
			<DialogContent
				className={className}
				showCloseButton={showCloseButton}
			>
				{!!header && (
					<DrawerHeader>
						<DrawerTitle>{header}</DrawerTitle>
					</DrawerHeader>
				)}
				{children}
			</DialogContent>
		</Dialog>
	);
}
