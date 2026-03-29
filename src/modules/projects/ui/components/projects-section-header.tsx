import CommandKbd from "@components/command-kbd";

interface Props {
	title: string;
	kbdProps?: React.ComponentProps<typeof CommandKbd>;
}

export default function ProjectsSectionHeader({ title, kbdProps }: Props) {
	return (
		<header className="flex w-full justify-center gap-2">
			<h2 className="mr-auto text-muted-foreground">{title}</h2>
			{kbdProps && <CommandKbd {...kbdProps} />}
		</header>
	);
}
