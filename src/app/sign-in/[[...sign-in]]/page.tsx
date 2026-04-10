import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { URLs } from "@lib/urls";
import { Loader2Icon } from "lucide-react";
import { redirect } from "next/navigation";

export default async function SignInPage() {
	// Check if user is already authenticated
	const { userId } = await auth();

	// Redirect authenticated users to home
	if (userId) {
		redirect(URLs.root);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background via-background to-muted/30 px-4">
			<div className="flex flex-col gap-8">
				<div className="text-center">
					<h1 className="font-bold text-3xl tracking-tight">Caret</h1>

					<p className="mt-2 text-muted-foreground text-sm">
						Sign in to access your projects
					</p>
				</div>

				<div className="grid place-items-center rounded-lg border border-border bg-card p-6 shadow-lg">
					<SignIn
						fallback={<Loader2Icon className="animate-spin" />}
					/>
				</div>
			</div>
		</div>
	);
}
