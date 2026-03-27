import type { ModalProps } from "./use-modal";

interface Opts {
	onOpen?: () => void;
	onClose?: () => void;
}

interface Props {
	onOpenChange: ModalProps["onOpenChange"];
}

export default function useModalHandler(
	{ onOpenChange }: Props,
	options?: Opts,
) {
	const handleOpenChange = (isOpen: boolean) => {
		if (isOpen) {
			options?.onOpen?.();
		} else {
			options?.onClose?.();
		}

		onOpenChange(isOpen);
	};

	return {
		onOpenChange: handleOpenChange,
		openModalSafe: () => handleOpenChange(true),
		closeModalSafe: () => handleOpenChange(false),
	};
}
