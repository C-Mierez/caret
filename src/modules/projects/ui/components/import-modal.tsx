"use client";

import ResponsiveModal from "@components/modals/responsive-modal";
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
import { buildProjectUrl } from "@lib/urls";
import useProjectImport from "@modules/projects/hooks/use-project-import";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const importFormSchema = z.object({
	url: z.string().url("Please enter a valid GitHub repository URL"),
});

type ImportFormData = z.infer<typeof importFormSchema>;

interface Props extends ModalProps {}

export default function ImportModal({ ...modalProps }: Props) {
	const { closeModalSafe, onOpenChange } = useModalHandler({
		onOpenChange: modalProps.onOpenChange,
	});

	const router = useRouter();
	const {
		import: importProject,
		isLoading: isSubmitting,
		error: hookError,
	} = useProjectImport();

	const [isRedirecting, setIsRedirecting] = useState(false);

	const defaultValues = useMemo<ImportFormData>(
		() => ({
			url: "",
		}),
		[],
	);

	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: importFormSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				const response = await importProject({
					url: value.url,
				});

				// Project created successfully
				toast.success("Project created! Redirecting...");

				// Redirect to the project page
				setIsRedirecting(true);
				setTimeout(() => {
					router.push(buildProjectUrl(response.projectId || ""));
					closeModalSafe();
				}, 500);
			} catch {
				toast.error(hookError || "Failed to import project");
			}
		},
	});

	// Reset form when modal opens
	useEffect(() => {
		if (modalProps.isOpen) {
			form.reset(defaultValues);
			setIsRedirecting(false);
		}
	}, [modalProps.isOpen, defaultValues, form]);

	const handleClose = useCallback(() => {
		closeModalSafe();
	}, [closeModalSafe]);

	const handleRetry = useCallback(() => {
		form.reset(defaultValues);
		setIsRedirecting(false);
	}, [form, defaultValues]);

	const isError = hookError && !isRedirecting;

	return (
		<ResponsiveModal
			{...{
				...modalProps,
				onOpenChange,
			}}
			header="Import Project from GitHub"
			className="max-w-md"
		>
			{isRedirecting ? (
				// Redirecting state
				<div className="flex flex-col gap-4 p-4">
					<div className="flex flex-col gap-2">
						<h3 className="font-semibold text-sm">
							Project Created
						</h3>
						<p className="text-muted-foreground text-sm">
							Your project is being created and files are being
							imported in the background. Redirecting...
						</p>
					</div>
					<div className="flex items-center justify-center py-4">
						<Loader2Icon className="size-6 animate-spin text-muted-foreground" />
					</div>
				</div>
			) : isError ? (
				// Error state
				<div className="flex flex-col gap-4 p-4">
					<div className="flex flex-col gap-2">
						<h3 className="font-semibold text-destructive text-sm">
							Import Failed
						</h3>
						<p className="text-muted-foreground text-sm">
							{hookError ||
								"Something went wrong while importing your project. Please try again."}
						</p>
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={handleClose}
							className="flex-1"
						>
							Close
						</Button>
						<Button onClick={handleRetry} className="flex-1">
							Retry
						</Button>
					</div>
				</div>
			) : (
				// Form state (idle or submitting)
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="flex flex-col gap-4 p-4"
				>
					<FieldGroup>
						<form.Field
							name="url"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched &&
									!field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											Repository URL
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.setValue(e.target.value)
											}
											placeholder="https://github.com/owner/repo"
											disabled={isSubmitting}
											type="url"
										/>
										{isInvalid && (
											<FieldError>
												{typeof field.state.meta
													.errors[0] === "string"
													? field.state.meta.errors[0]
													: "Invalid input"}
											</FieldError>
										)}
										<FieldDescription>
											Enter the URL of the GitHub
											repository you want to import.
										</FieldDescription>
									</Field>
								);
							}}
						/>
					</FieldGroup>

					<Separator />

					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={isSubmitting}
							className="flex-1"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="flex-1"
						>
							{isSubmitting ? (
								<>
									<Loader2Icon className="mr-2 size-4 animate-spin" />
									Importing...
								</>
							) : (
								"Import"
							)}
						</Button>
					</div>
				</form>
			)}
		</ResponsiveModal>
	);
}
