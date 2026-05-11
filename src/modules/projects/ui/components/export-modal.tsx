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
import type { Id } from "@convex/_generated/dataModel";
import type { ModalProps } from "@hooks/use-modal";
import useModalHandler from "@hooks/use-modal-handler";
import useProjectExport from "@modules/projects/hooks/use-project-export";
import useProjectResetExportState from "@modules/projects/hooks/use-project-reset-export-state";
import { useForm } from "@tanstack/react-form";
import { HTTPError, default as ky } from "ky";
import { Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";

const exportFormSchema = z.object({
	repositoryName: z.string().min(1, "Repository name is required").max(100),
	description: z
		.string()
		.max(1000, "Description must be 1000 characters or less")
		.optional(),
	visibility: z.enum(["private", "public"]),
});

type ExportFormData = z.infer<typeof exportFormSchema>;

interface Props extends ModalProps {
	projectId: Id<"projects">;
}

export default function ExportModal({ projectId, ...modalProps }: Props) {
	const { preloadedResult: project } = useProjectsGetOwnedById();
	const { closeModalSafe, onOpenChange } = useModalHandler({
		onOpenChange: modalProps.onOpenChange,
	});

	const {
		export: exportProject,
		isLoading: isSubmitting,
		error: hookError,
	} = useProjectExport();
	const resetExportState = useProjectResetExportState();

	const defaultValues = useMemo<ExportFormData>(
		() => ({
			repositoryName: project?.name || "",
			description: "",
			visibility: "private" as const,
		}),
		[project?.name],
	);

	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: exportFormSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				// Construct a placeholder GitHub URL - the actual owner will be determined from the GitHub token on the backend
				const url = `https://github.com/user/${value.repositoryName}`;

				await exportProject({
					projectId,
					url,
					repositoryName: value.repositoryName,
					description: value.description || undefined,
					visibility: value.visibility,
				});

				toast.success("Export started. Processing your project...");
				// Keep modal open to show progress
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: hookError || "Failed to start export";
				toast.error(message);
			}
		},
	});

	// Reset form when modal opens
	useEffect(() => {
		if (modalProps.isOpen) {
			form.reset(defaultValues);
		}
	}, [modalProps.isOpen, defaultValues, form]);

	// Determine state
	const isExporting = project?.exportStatus === "exporting";
	const isCompleted = project?.exportStatus === "completed";
	const isFailed = project?.exportStatus === "failed";
	const isCanceled = project?.exportStatus === "canceled";
	const handleCancel = useCallback(async () => {
		try {
			await ky.post("/api/github/export/cancel", {
				json: { projectId },
			});
			toast.success("Export cancelled");
			closeModalSafe();
		} catch (error) {
			let message = "Failed to cancel export";

			if (error instanceof HTTPError) {
				try {
					const payload = (await error.response.json()) as {
						error?: string;
					};
					message =
						payload.error || error.response.statusText || message;
				} catch {
					message =
						error.response.statusText || error.message || message;
				}
			} else if (error instanceof Error) {
				message = error.message;
			}

			toast.error(message);
		}
	}, [projectId, closeModalSafe]);

	const handleRetry = useCallback(async () => {
		try {
			await resetExportState({ projectId });
			form.reset(defaultValues);
			toast.success("Export reset");
		} catch {
			toast.error("Failed to reset export state");
		}
	}, [defaultValues, form, projectId, resetExportState]);

	const handleClose = useCallback(() => {
		closeModalSafe();
	}, [closeModalSafe]);

	return (
		<ResponsiveModal
			{...{
				...modalProps,
				onOpenChange,
			}}
			header="Export Project to GitHub"
			className="max-w-md"
		>
			{isCompleted && project?.exportRepoUrl ? (
				// Success state
				<div className="flex flex-col gap-4 p-4">
					<div className="flex flex-col gap-2">
						<h3 className="font-semibold text-sm">
							Export Completed
						</h3>
						<p className="text-muted-foreground text-sm">
							Your project has been successfully exported to
							GitHub.
						</p>
						<a
							href={project.exportRepoUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-500 text-sm underline hover:text-blue-600"
						>
							View repository
						</a>
					</div>
					<Button onClick={handleClose} className="w-full">
						Close
					</Button>
				</div>
			) : isFailed ? (
				// Error state
				<div className="flex flex-col gap-4 p-4">
					<div className="flex flex-col gap-2">
						<h3 className="font-semibold text-destructive text-sm">
							Export Failed
						</h3>
						<p className="text-muted-foreground text-sm">
							Something went wrong while exporting your project.
							Please try again.
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
			) : isCanceled ? (
				// Canceled state
				<div className="flex flex-col gap-4 p-4">
					<div className="flex flex-col gap-2">
						<h3 className="font-semibold text-sm">
							Export Cancelled
						</h3>
						<p className="text-muted-foreground text-sm">
							The export was cancelled.
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
			) : isExporting ? (
				// In progress state
				<div className="flex flex-col gap-4 p-4">
					<div className="flex flex-col gap-2">
						<h3 className="font-semibold text-sm">Exporting...</h3>
						<p className="text-muted-foreground text-sm">
							Your project is being exported. This may take a few
							minutes.
						</p>
					</div>
					<div className="flex items-center justify-center py-4">
						<Loader2Icon className="size-6 animate-spin text-muted-foreground" />
					</div>
					<Button
						variant="outline"
						onClick={handleCancel}
						disabled={isSubmitting}
						className="w-full"
					>
						Cancel Export
					</Button>
				</div>
			) : (
				// Form state (idle)
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="flex flex-col gap-4 p-4"
				>
					<FieldGroup>
						<form.Field
							name="repositoryName"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched &&
									!field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											Repository Name
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.setValue(e.target.value)
											}
											placeholder="my-project"
											disabled={isSubmitting}
										/>
										{isInvalid && (
											<FieldError>
												{typeof field.state.meta
													.errors[0] === "string"
													? field.state.meta.errors[0]
													: "Invalid input"}
											</FieldError>
										)}
									</Field>
								);
							}}
						/>

						<form.Field
							name="description"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched &&
									!field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											Description (Optional)
										</FieldLabel>
										<textarea
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.setValue(e.target.value)
											}
											placeholder="Describe your project..."
											disabled={isSubmitting}
											className="rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
											rows={3}
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
											{(field.state.value || "").length}
											/1000 characters
										</FieldDescription>
									</Field>
								);
							}}
						/>

						<form.Field
							name="visibility"
							children={(field) => {
								return (
									<Field>
										<FieldLabel>Visibility</FieldLabel>
										<div className="flex gap-4">
											<label className="flex cursor-pointer items-center gap-2">
												<input
													type="radio"
													name="visibility"
													value="private"
													checked={
														field.state.value ===
														"private"
													}
													onChange={() =>
														field.setValue(
															"private",
														)
													}
													disabled={isSubmitting}
													className="accent-foreground"
												/>
												<span className="text-sm">
													Private
												</span>
											</label>
											<label className="flex cursor-pointer items-center gap-2">
												<input
													type="radio"
													name="visibility"
													value="public"
													checked={
														field.state.value ===
														"public"
													}
													onChange={() =>
														field.setValue("public")
													}
													disabled={isSubmitting}
													className="accent-foreground"
												/>
												<span className="text-sm">
													Public
												</span>
											</label>
										</div>
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
									Starting...
								</>
							) : (
								"Export"
							)}
						</Button>
					</div>
				</form>
			)}
		</ResponsiveModal>
	);
}
