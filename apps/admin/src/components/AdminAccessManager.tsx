"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_ROLES, ADMIN_LICENSES, SERIES_24 } from "@/lib/adminAccess";

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  licenses: string[];
}

function LicenseSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (licenses: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function toggle(license: string) {
    onChange(
      value.includes(license) ? value.filter((l) => l !== license) : [...value, license]
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 border border-hairline bg-page px-3 py-2 text-left text-sm focus:border-navy-800 focus:outline-none"
      >
        <span className={value.length ? "text-ink" : "text-ink-muted"}>
          {value.length ? value.join(", ") : "Select any that apply…"}
        </span>
        <span className="text-ink-muted">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto border border-hairline bg-card p-1.5 shadow-lg">
          {ADMIN_LICENSES.map((license) => (
            <label
              key={license}
              className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm text-ink hover:bg-page"
            >
              <input
                type="checkbox"
                checked={value.includes(license)}
                onChange={() => toggle(license)}
              />
              {license}
              {license === SERIES_24 && (
                <span className="text-xs text-ink-muted">— grants Compliance Review</span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function RoleSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (role: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
    >
      <option value="">—</option>
      {ADMIN_ROLES.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </select>
  );
}

function LicenseChips({ licenses }: { licenses: string[] }) {
  if (licenses.length === 0) return <span className="text-xs text-ink-muted">none yet</span>;
  return (
    <>
      {licenses.map((license) => (
        <span
          key={license}
          className={`mb-0.5 mr-1 inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            license === SERIES_24 ? "bg-success text-white" : "bg-ink-muted/15 text-ink-secondary"
          }`}
        >
          {license}
        </span>
      ))}
    </>
  );
}

export function AdminAccessManager({ initialUsers }: { initialUsers: AdminUserRow[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [licenses, setLicenses] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editLicenses, setEditLicenses] = useState<string[]>([]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        name: name.trim() || undefined,
        role: role || null,
        licenses,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Failed to add");
      return;
    }
    setEmail("");
    setName("");
    setRole("");
    setLicenses([]);
    router.refresh();
  }

  function startEdit(user: AdminUserRow) {
    setEditingId(user.id);
    setEditName(user.name ?? "");
    setEditRole(user.role ?? "");
    setEditLicenses(user.licenses);
  }

  async function saveEdit() {
    if (!editingId) return;
    setBusy(true);
    await fetch(`/api/admin-users/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim() || null,
        role: editRole || null,
        licenses: editLicenses,
      }),
    });
    setBusy(false);
    setEditingId(null);
    router.refresh();
  }

  async function remove(user: AdminUserRow) {
    if (!window.confirm(`Remove ${user.email} from admin access?`)) return;
    await fetch(`/api/admin-users/${user.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-8 border border-hairline bg-card p-6">
        <h2 className="mb-4 font-serif text-lg text-ink">Grant Access</h2>
        <form onSubmit={handleAdd} className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr_auto] lg:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              Regiment Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@regimentsecurities.com"
              className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Auto-filled at sign-in"
              className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              Role
            </label>
            <RoleSelect value={role} onChange={setRole} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              Licenses &amp; Exams
            </label>
            <LicenseSelect value={licenses} onChange={setLicenses} />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="bg-brand-red px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-red-dark disabled:opacity-50"
          >
            Add
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-brand-red">{error}</p>}
      </div>

      <div className="border border-hairline bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Licenses</th>
              <th className="px-4 py-3">Compliance</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {initialUsers.map((user) => (
              <>
                <tr key={user.id} className="border-b border-hairline last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{user.email}</td>
                  <td className="px-4 py-3 text-ink-secondary">
                    {user.name || <span className="text-xs text-ink-muted">auto-fills at next sign-in</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-secondary">{user.role || "—"}</td>
                  <td className="px-4 py-3">
                    <LicenseChips licenses={user.licenses} />
                  </td>
                  <td className="px-4 py-3">
                    {user.licenses.includes(SERIES_24) ? (
                      <span className="text-xs font-bold text-success">✓ Reviewer</span>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => (editingId === user.id ? setEditingId(null) : startEdit(user))}
                      className="mr-4 text-xs font-semibold uppercase text-navy-950 hover:underline"
                    >
                      {editingId === user.id ? "Close" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(user)}
                      className="text-xs font-semibold uppercase text-brand-red hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
                {editingId === user.id && (
                  <tr key={`${user.id}-edit`} className="border-b border-hairline bg-page last:border-0">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr_auto] lg:items-end">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                            Name
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full border border-hairline bg-card px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                            Role
                          </label>
                          <RoleSelect value={editRole} onChange={setEditRole} />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                            Licenses &amp; Exams
                          </label>
                          <LicenseSelect value={editLicenses} onChange={setEditLicenses} />
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={saveEdit}
                          className="bg-navy-950 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {initialUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-secondary">
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
