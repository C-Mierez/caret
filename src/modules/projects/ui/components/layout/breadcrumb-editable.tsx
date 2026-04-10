"use client";

import { BreadcrumbPage } from "@components/ui/breadcrumb";
import { Input } from "@components/ui/input";
import useProjectRename from "@modules/projects/hooks/use-project-rename";
import { useState } from "react";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";

export default function BreadcrumbEditable() {
	const { preloadedResult: project } = useProjectsGetOwnedById();
	const projectId = project?._id;
	const projectName = project?.name ?? "";
	const [isEditing, setIsEditing] = useState(false);
	const [editedName, setEditedName] = useState(projectName);

	const renameMutation = useProjectRename();

	if (!projectId) {
		return null;
	}

	const Slot = isEditing ? "div" : "button";

	const handleBlur = () => {
		setIsEditing(false);
		if (editedName !== projectName) {
			renameMutation({
				projectId,
				newName: editedName,
			});
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.currentTarget.blur();
		}

		if (e.key === "Escape") {
			setIsEditing(false);
			setEditedName(projectName);
		}
	};

	return (
		<Slot
			type="button"
			onClick={() => {
				if (isEditing) return;
				setIsEditing((isEditing) => !isEditing);
			}}
		>
			{isEditing ? (
				<Input
					autoFocus
					type="text"
					value={editedName}
					onChange={(e) => setEditedName(e.target.value)}
					onBlur={handleBlur}
					onKeyDown={handleKeyDown}
				/>
			) : (
				<BreadcrumbPage className="max-w-20 truncate md:max-w-40">
					{projectName}
				</BreadcrumbPage>
			)}
		</Slot>
	);
}
