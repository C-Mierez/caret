import CommandKbd from "@components/command-kbd";

interface Props {
	icon: React.ReactNode;
	label: string;
	kbdProps: React.ComponentProps<typeof CommandKbd>;
	onClick: () => void;
}

export function CTAButton({ icon, label, kbdProps, onClick }: Props) {
	return (
		<button
			className="group animated flex flex-col gap-8 border border-muted-foreground-alt bg-muted p-4 text-start hover:border-muted-foreground md:p-8"
			type="button"
			onClick={onClick}
		>
			<div className="flex justify-between gap-2">
				{icon}
				<CommandKbd {...kbdProps} />
			</div>
			<p className="font-medium text-xl">{label}</p>
		</button>
	);
}
