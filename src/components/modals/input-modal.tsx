import { Button } from "@components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@components/ui/field";
import { Input } from "@components/ui/input";
import { Separator } from "@components/ui/separator";
import type { ModalProps } from "@hooks/use-modal";
import useModalHandler from "@hooks/use-modal-handler";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { z } from "zod";
import ResponsiveModal from "./responsive-modal";

interface Props extends ModalProps {
	title?: string;
	message: string;
	placeholder?: string;
	initialValue?: string;
	onConfirm: (input: string) => void;
	onCancel?: (input?: string) => void;
}

const inputSchema = z.object({
	input: z.string(),
});

export default function InputModal({
	title,
	message,
	placeholder,
	initialValue,
	onConfirm,
	onCancel,
	...modalProps
}: Props) {
	const { closeModalSafe, onOpenChange } = useModalHandler({
		onOpenChange: modalProps.onOpenChange,
	});

	const form = useForm({
		defaultValues: {
			input: initialValue || "",
		},
		validators: {
			onSubmit: inputSchema,
		},
		onSubmit: ({ value }) => {
			onConfirm(value.input);
			form.reset();
			closeModalSafe();
		},
	});

	useEffect(() => {
		form.setFieldValue("input", initialValue || "");
	}, [form, initialValue]);

	const handleCancel = () => {
		closeModalSafe();
		onCancel?.(form.getFieldValue("input"));
		form.reset();
	};

	return (
		<ResponsiveModal
			{...{
				...modalProps,
				onOpenChange,
			}}
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="flex flex-col gap-3"
			>
				<FieldGroup>
					<form.Field
						name="input"
						children={(field) => {
							const isInvalid =
								field.state.meta.isTouched &&
								!field.state.meta.isValid;

							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										{title}
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
										placeholder={
											initialValue ||
											placeholder ||
											"Your input here"
										}
										aria-invalid={isInvalid}
									></Input>
									<FieldDescription>
										{message}
									</FieldDescription>
									{isInvalid && (
										<FieldError
											errors={field.state.meta.errors}
										/>
									)}
								</Field>
							);
						}}
					/>
				</FieldGroup>
				<Separator />
				<Field orientation="horizontal" className="justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={handleCancel}
					>
						Reset
					</Button>
					<Button type="submit">Submit</Button>
				</Field>
			</form>
		</ResponsiveModal>
	);
}
