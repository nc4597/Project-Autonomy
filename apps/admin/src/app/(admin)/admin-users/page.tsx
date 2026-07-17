import { revalidatePath } from "next/cache";
import { createAdminUser, listAdminUsers } from "@/lib/adminUserRepository";
import { DeleteAdminUserButton } from "@/components/DeleteAdminUserButton";

export const dynamic = "force-dynamic";

async function addAdminUser(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (!email) return;
  await createAdminUser(email, name || undefined);
  revalidatePath("/admin-users");
}

export default async function AdminUsersPage() {
  const adminUsers = await listAdminUsers();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ink">Admin Access</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          Only people listed here can sign in to this admin panel, and only
          with their Regiment Securities Microsoft account — signing in with
          Microsoft confirms who someone is, this list controls whether
          they're actually let in.
        </p>
      </div>

      <div className="mb-8 border border-hairline bg-card p-6">
        <h2 className="mb-4 font-serif text-lg text-ink">Grant Access</h2>
        <form action={addAdminUser} className="flex flex-wrap items-end gap-4">
          <div className="flex-1" style={{ minWidth: 240 }}>
            <label
              htmlFor="email"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary"
            >
              Regiment Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="name@regimentsecurities.com"
              className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
            />
          </div>
          <div className="flex-1" style={{ minWidth: 200 }}>
            <label
              htmlFor="name"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary"
            >
              Name (optional)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="For display only"
              className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="bg-brand-red px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-red-dark"
          >
            Add
          </button>
        </form>
      </div>

      <div className="border border-hairline bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {adminUsers.map((adminUser) => (
              <tr key={adminUser.id} className="border-b border-hairline last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{adminUser.email}</td>
                <td className="px-4 py-3 text-ink-secondary">{adminUser.name || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <DeleteAdminUserButton adminUserId={adminUser.id} email={adminUser.email} />
                </td>
              </tr>
            ))}
            {adminUsers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-ink-secondary">
                  Nobody has access yet — add an email above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
