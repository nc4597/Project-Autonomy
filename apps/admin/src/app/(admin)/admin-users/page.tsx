import { listAdminUsers } from "@/lib/adminUserRepository";
import { AdminAccessManager } from "@/components/AdminAccessManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const adminUsers = await listAdminUsers();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ink">Admin Access</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          Only people listed here can sign in to this admin panel, and only with their Regiment
          Securities Microsoft account. Compliance Review (verify/reject) additionally requires a
          Series 24 license.
        </p>
      </div>

      <AdminAccessManager
        initialUsers={adminUsers.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          licenses: user.licenses,
        }))}
      />
    </div>
  );
}
