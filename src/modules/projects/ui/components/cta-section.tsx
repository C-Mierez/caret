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
import ImportModal from "./import-modal";

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
	const newProjectModal = useModal({
		onOpen: () => {
			setNewProjectPlaceholder(generateRandomProjectName());
		},
	});
	const importModal = useModal();

	const onNewProjectConfirm = (input: string) => {
		if (input === "") {
			input = newProjectPlaceholder;
		}
		createProject({ name: input });
	};

	return (
		<>
			<section className="grid w-full gap-4 md:grid-cols-2">
				<CTAButton
					icon={<Sparkle />}
					label="New Project"
					kbdProps={{
						kbdKey: "j",
						kbdKeyLabel: "J",
						onTrigger: () => {},
					}}
					onClick={() => {
						newProjectModal.openModal();
					}}
				/>
				<CTAButton
					icon={<FaGithub className="size-6" />}
					label="Import Project"
					kbdProps={{
						kbdKey: "i",
						kbdKeyLabel: "I",
						onTrigger: () => {},
					}}
					onClick={() => {
						importModal.openModal();
					}}
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

			<ImportModal {...importModal} />
		</>
	);
}
