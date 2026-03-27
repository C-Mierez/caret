import { Kbd } from "@components/ui/kbd";

interface Props {
	icon: React.ReactNode;
	label: string;
	kbd: string;
	onClick: () => void;
}

export function CTAButton({ icon, label, kbd, onClick }: Props) {
	return (
		<button
			className="bg-muted border-muted-foreground-alt border flex flex-col gap-8 p-4 md:p-8 text-start"
			type="button"
			onClick={onClick}
		>
			<div className="flex gap-2 justify-between">
				{icon}
				<Kbd size={"sm"} variant={"outline"}>
					{kbd}
				</Kbd>
			</div>
			<p className="text-xl font-medium">{label}</p>
		</button>
	);
}
