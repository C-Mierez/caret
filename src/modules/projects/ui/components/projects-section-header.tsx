import CommandKbd from "@components/command-kbd";

interface Props {
	title: string;
	kbdProps?: React.ComponentProps<typeof CommandKbd>;
}

export default function ProjectsSectionHeader({ title, kbdProps }: Props) {
	return (
		<header className="w-full flex justify-center gap-2">
			<h2 className="text-muted-foreground mr-auto">{title}</h2>
			{kbdProps && <CommandKbd {...kbdProps} />}
		</header>
	);
}
