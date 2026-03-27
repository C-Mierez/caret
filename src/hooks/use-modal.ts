import { useEffect, useState } from "react";

interface Props {
	isModalOpen?: boolean;
	onOpenChange?: (isModalOpen: boolean) => void;
	onClose?: () => void;
	onOpen?: () => void;
}

export default function useModal({
	isModalOpen = false,
	onOpenChange,
	onClose,
	onOpen,
}: Props): ModalProps {
	const [isOpen, setIsOpen] = useState(isModalOpen);

	useEffect(() => {
		setIsOpen(isModalOpen);
	}, [isModalOpen]);

	const handleOnChange = (isOpen: boolean) => {
		if (isOpen) {
			onOpen?.();
		} else {
			onClose?.();
		}
		onOpenChange?.(isOpen);
		setIsOpen(isOpen);
	};

	const openModal = () => {
		handleOnChange(true);
	};
	const closeModal = () => {
		handleOnChange(false);
	};

	return {
		isOpen,
		onOpenChange: handleOnChange,
		openModal,
		closeModal,
		modal: true,
	};
}

export interface ModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	openModal: () => void;
	closeModal: () => void;
	modal?: boolean;
}
