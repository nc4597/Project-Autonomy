"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface DealOption {
  id: string;
  name: string;
}

export interface SiteSettingsFormValues {
  capitalRaised: string;
  completedTransactions: string;
  activeDeals: string;
  investorNetwork: string;
  teamSectionTitle: string;
  teamSectionSubtitle: string;
  featuredDealId: string | null;
  featuredClosedDealIds: string[];
}

export function SiteSettingsForm({
  initialValues,
  liveDeals,
  closedDeals,
}: {
  initialValues: SiteSettingsFormValues;
  liveDeals: DealOption[];
  closedDeals: DealOption[];
}) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof SiteSettingsFormValues>(key: K, value: SiteSettingsFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function toggleClosedDeal(id: string) {
    set(
      "featuredClosedDealIds",
      values.featuredClosedDealIds.includes(id)
        ? values.featuredClosedDealIds.filter((d) => d !== id)
        : [...values.featuredClosedDealIds, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="border border-hairline bg-card p-6">
        <h2 className="mb-4 font-serif text-xl text-ink">KPI Cards</h2>
        <div className="grid grid-cols-2 gap-4">
          {(
            [
              ["capitalRaised", "Capital Raised"],
              ["completedTransactions", "Completed Transactions"],
              ["activeDeals", "Active Deals"],
              ["investorNetwork", "Investor Network"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
                {label}
              </label>
              <input
                value={values[key]}
                onChange={(e) => set(key, e.target.value)}
                className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="border border-hairline bg-card p-6">
        <h2 className="mb-4 font-serif text-xl text-ink">About Page — Team Section</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              Section Title
            </label>
            <input
              value={values.teamSectionTitle}
              onChange={(e) => set("teamSectionTitle", e.target.value)}
              className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              Subtitle
            </label>
            <input
              value={values.teamSectionSubtitle}
              onChange={(e) => set("teamSectionSubtitle", e.target.value)}
              className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
            />
            <p className="mt-1 text-xs text-ink-muted">
              Shown under the title. Write {"{count}"} anywhere and it renders as the live number
              of team members. Leave empty to show no subtitle.
            </p>
          </div>
        </div>
      </section>

      <section className="border border-hairline bg-card p-6">
        <h2 className="mb-4 font-serif text-xl text-ink">Featured Deal (Current Offering)</h2>
        <select
          value={values.featuredDealId ?? ""}
          onChange={(e) => set("featuredDealId", e.target.value || null)}
          className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
        >
          <option value="">None selected</option>
          {liveDeals.map((deal) => (
            <option key={deal.id} value={deal.id}>
              {deal.name}
            </option>
          ))}
        </select>
        {liveDeals.length === 0 && (
          <p className="mt-2 text-xs text-ink-muted">
            No live deals yet — add one first to feature it here.
          </p>
        )}
      </section>

      <section className="border border-hairline bg-card p-6">
        <h2 className="mb-4 font-serif text-xl text-ink">
          Recently Closed Transactions
        </h2>
        <div className="space-y-2">
          {closedDeals.map((deal) => (
            <label key={deal.id} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={values.featuredClosedDealIds.includes(deal.id)}
                onChange={() => toggleClosedDeal(deal.id)}
              />
              {deal.name}
            </label>
          ))}
        </div>
        {closedDeals.length === 0 && (
          <p className="text-xs text-ink-muted">
            No closed deals yet — mark a deal as Closed to feature it here.
          </p>
        )}
      </section>

      <div className="flex items-center justify-end gap-4">
        {saved && <span className="text-sm text-success">Saved</span>}
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-red-dark disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
