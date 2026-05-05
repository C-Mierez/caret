"use client";

import { Button } from "@components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@components/ui/field";
import { Input } from "@components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@components/ui/popover";
import type { Id } from "@convex/_generated/dataModel";
import useModal from "@hooks/use-modal";
import useUpdateProjectSettings from "@modules/projects/hooks/use-update-project-settings";
import { useForm } from "@tanstack/react-form";
import { SettingsIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { z } from "zod";

interface Props {
	projectId: Id<"projects">;
	initialValues?: {
		installCommand?: string;
		devCommand?: string;
	};
	onSave?: () => void;
}

const formSchema = z.object({
	installCommand: z.string(),
	devCommand: z.string(),
});

export default function PreviewSettingsPopover({
	projectId,
	initialValues,
	onSave,
}: Props) {
	const updateSettings = useUpdateProjectSettings();
	const previewSettingsModal = useModal();
	const defaultValues = useMemo(
		() => ({
			installCommand: initialValues?.installCommand ?? "",
			devCommand: initialValues?.devCommand ?? "",
		}),
		[initialValues?.devCommand, initialValues?.installCommand],
	);

	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			await updateSettings({
				projectId,
				settings: {
					installCommand: value.installCommand.trim() || undefined,
					devCommand: value.devCommand.trim() || undefined,
				},
			});
			previewSettingsModal.closeModal();
			onSave?.();
		},
	});

	useEffect(() => {
		if (previewSettingsModal.isOpen) {
			form.reset(defaultValues);
		}
	}, [defaultValues, form, previewSettingsModal.isOpen]);

	return (
		<Popover
			open={previewSettingsModal.isOpen}
			onOpenChange={previewSettingsModal.onOpenChange}
		>
			<PopoverTrigger
				render={
					<Button
						type="button"
						size="sm"
						variant="ghost"
						className="h-full rounded-none"
						title="Preview settings"
					>
						<SettingsIcon className="size-3" />
					</Button>
				}
			/>
			<PopoverContent className="w-80" align="end">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="space-y-4"
				>
					<div className="space-y-1">
						<h4 className="font-medium text-sm">
							Preview Settings
						</h4>
						<p className="text-muted-foreground text-xs">
							Configure how your project runs in the preview.
						</p>
					</div>
					<form.Field name="installCommand">
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>
									Install Command
								</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) =>
										field.handleChange(e.target.value)
									}
									placeholder="npm install"
								/>
								<FieldDescription>
									Command to install dependencies
								</FieldDescription>
							</Field>
						)}
					</form.Field>
					<form.Field name="devCommand">
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>
									Start Command
								</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) =>
										field.handleChange(e.target.value)
									}
									placeholder="npm run dev"
								/>
								<FieldDescription>
									Command to start the development server
								</FieldDescription>
							</Field>
						)}
					</form.Field>
					<form.Subscribe
						selector={(state) => [
							state.canSubmit,
							state.isSubmitting,
						]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button
								type="submit"
								className="w-full"
								disabled={!canSubmit || isSubmitting}
							>
								{isSubmitting ? "Saving..." : "Save Changes"}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</PopoverContent>
		</Popover>
	);
}
