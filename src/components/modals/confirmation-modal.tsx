import { Button } from "@components/ui/button";
import type { ModalProps } from "@hooks/use-modal";
import useModalHandler from "@hooks/use-modal-handler";
import ResponsiveModal from "./responsive-modal";

interface Props extends ModalProps {
	title?: string;
	message: string;
	type?: "default" | "destructive";
	onConfirm: () => void;
	onCancel?: () => void;
}

export default function ConfirmationModal({
	title,
	message,
	type = "default",
	onConfirm,
	onCancel,
	...modalProps
}: Props) {
	const { closeModalSafe, onOpenChange } = useModalHandler({
		onOpenChange: modalProps.onOpenChange,
	});

	const handleCancel = () => {
		closeModalSafe();
		onCancel?.();
	};

	return (
		<ResponsiveModal
			{...{
				...modalProps,
				onOpenChange,
			}}
		>
			<div className="flex flex-col gap-2 p-4">
				{title && (
					<h2 className="text-balance text-start font-bold text-xl">
						{title}
					</h2>
				)}
				<p className="text-muted-foreground text-sm">{message}</p>
				<div className="flex justify-end gap-2">
					<Button
						type="button"
						variant={"ghost"}
						onClick={handleCancel}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant={
							type === "destructive" ? "destructive" : "secondary"
						}
						onClick={() => {
							onConfirm();
							closeModalSafe();
						}}
					>
						Confirm
					</Button>
				</div>
			</div>
		</ResponsiveModal>
	);
}
