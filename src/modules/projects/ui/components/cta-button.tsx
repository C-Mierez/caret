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
			className="bg-muted border-muted-foreground-alt border flex flex-col gap-8 p-4 md:p-8 text-start group hover:border-muted-foreground animated"
			type="button"
			onClick={onClick}
		>
			<div className="flex gap-2 justify-between">
				{icon}
				<CommandKbd {...kbdProps} />
			</div>
			<p className="text-xl font-medium">{label}</p>
		</button>
	);
}
