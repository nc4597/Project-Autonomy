import { signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; from?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-6">
      <div className="w-full max-w-sm border border-hairline bg-card p-8 text-center">
        <h1 className="mb-1 font-serif text-2xl text-ink">Regiment Marketplace</h1>
        <p className="mb-6 text-sm text-ink-secondary">Admin sign in</p>

        {searchParams.error && (
          <p className="mb-6 border border-brand-red bg-brand-red/5 px-4 py-3 text-sm text-brand-red">
            {searchParams.error === "AccessDenied"
              ? "Your account isn't authorized to access this admin panel. Contact an administrator if you believe this is a mistake."
              : "Something went wrong signing in. Please try again."}
          </p>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", { redirectTo: searchParams.from || "/" });
          }}
        >
          <button
            type="submit"
            className="w-full bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-brand-red-dark"
          >
            Sign in with Microsoft
          </button>
        </form>
      </div>
    </div>
  );
}
