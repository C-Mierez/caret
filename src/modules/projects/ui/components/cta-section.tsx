"use client";

import InputModal from "@components/modals/input-modal";
import useModal from "@hooks/use-modal";
import useProjectCreate from "@modules/projects/hooks/use-project-create";
import { Sparkle } from "lucide-react";
import { useState } from "react";
import { FaGithub } from "react-icons/fa";
import {
	adjectives,
	animals,
	colors,
	uniqueNamesGenerator,
} from "unique-names-generator";
import { CTAButton } from "./cta-button";

function generateRandomProjectName() {
	return uniqueNamesGenerator({
		dictionaries: [adjectives, colors, animals],
		separator: "-",
		length: 3,
	});
}

export function CTASection() {
	const [newProjectPlaceholder, setNewProjectPlaceholder] = useState("");

	const createProject = useProjectCreate();

	const onNewProjectConfirm = (input: string) => {
		if (input === "") {
			input = newProjectPlaceholder;
		}
		createProject({ name: input });
	};

	const newProjectModal = useModal({
		onOpen: () => {
			setNewProjectPlaceholder(generateRandomProjectName());
		},
	});

	return (
		<>
			<section className="grid md:grid-cols-2 gap-4 w-full">
				<CTAButton
					icon={<Sparkle />}
					label="New Project"
					kbd="⌘ J"
					onClick={() => {
						newProjectModal.openModal();
					}}
				/>
				<CTAButton
					icon={<FaGithub className="size-6" />}
					label="Import Project"
					kbd="⌘ I"
					onClick={() => {}}
				/>
			</section>

			<InputModal
				title="New project"
				message="Give your new project a name or leave empty for a random one."
				placeholder={newProjectPlaceholder}
				initialValue={newProjectPlaceholder}
				onConfirm={onNewProjectConfirm}
				{...newProjectModal}
			/>
		</>
	);
}
