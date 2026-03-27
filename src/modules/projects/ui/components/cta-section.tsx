"use client";

import InputModal from "@components/modals/input-modal";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import useModal from "@hooks/use-modal";
import { useMutation } from "convex/react";
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

	const createProject = useMutation(api.projects.create).withOptimisticUpdate(
		(localStore, args) => {
			const now = Date.now();
			const newProject = {
				_id: crypto.randomUUID() as Id<"projects">,
				_creationTime: now,
				name: args.name,
				ownerId: "temp-id",
				updated_at: now,
				exportStatus: "not_started",
				importStatus: "not_started",
			} as Doc<"projects">;

			for (const cachedQuery of localStore.getAllQueries(
				api.projects.getOwnedInfinite,
			)) {
				if (cachedQuery.value === undefined) {
					continue;
				}

				if (cachedQuery.args.paginationOpts.cursor !== null) {
					continue;
				}

				localStore.setQuery(
					api.projects.getOwnedInfinite,
					cachedQuery.args,
					{
						...cachedQuery.value,
						page: [newProject, ...cachedQuery.value.page],
					},
				);
			}
		},
	);

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
