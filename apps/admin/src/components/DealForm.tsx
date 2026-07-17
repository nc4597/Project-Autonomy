"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BulletListField, type BulletItem } from "./BulletListField";
import { FaqListField, type FaqItem } from "./FaqListField";
import { ImageUploadField } from "./ImageUploadField";
import { LabelValueListField, type LabelValueItem } from "./LabelValueListField";
import { LeadershipListField, type LeadershipItem } from "./LeadershipListField";
import { OFFERING_TYPE_LABELS, SECTOR_LABELS } from "@/lib/labels";

// The API returns either a plain string message or a Zod .flatten()
// object ({ formErrors: string[], fieldErrors: Record<string, string[]> })
// — this always resolves to a displayable string instead of risking
// React trying to render the object directly.
function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const flat = error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
    if (flat.formErrors?.[0]) return flat.formErrors[0];
    const firstFieldError = Object.values(flat.fieldErrors ?? {}).find((msgs) => msgs?.[0]);
    if (firstFieldError?.[0]) return firstFieldError[0];
  }
  return "Could not save deal";
}

export interface DealFormValues {
  slug: string;
  status: "LIVE" | "CLOSED";
  name: string;
  subheader: string;
  sector: string;
  offeringType: string;
  logoUrl: string | null;
  thumbnailUrl: string | null;
  bannerImageUrl: string | null;
  repName: string;
  repPhotoUrl: string | null;
  repEmail: string;
  raiseGoal: string;
  raisedAmount: string;
  raisedAmountUndisclosed: boolean;
  minimumInvestment: string;
  companyOverview: string;
  closeDate: string;
  marketOpportunityNarrative: string;
  sidebarFields: LabelValueItem[];
  snapshotFields: LabelValueItem[];
  whyInvestBullets: BulletItem[];
  marketStats: LabelValueItem[];
  leadership: LeadershipItem[];
  faqs: FaqItem[];
}

export const emptyDealForm: DealFormValues = {
  slug: "",
  status: "LIVE",
  name: "",
  subheader: "",
  sector: "AI",
  offeringType: "REG_D_506C",
  logoUrl: null,
  thumbnailUrl: null,
  bannerImageUrl: null,
  repName: "",
  repPhotoUrl: null,
  repEmail: "",
  raiseGoal: "",
  raisedAmount: "",
  raisedAmountUndisclosed: false,
  minimumInvestment: "",
  companyOverview: "",
  closeDate: "",
  marketOpportunityNarrative: "",
  sidebarFields: [],
  snapshotFields: [],
  whyInvestBullets: [],
  marketStats: [],
  leadership: [],
  faqs: [],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-hairline bg-card p-6">
      <h2 className="mb-4 font-serif text-xl text-ink">{title}</h2>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const id = slugify(label);
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
      />
    </div>
  );
}

export function DealForm({
  mode,
  dealId,
  initialValues,
}: {
  mode: "create" | "edit";
  dealId?: string;
  initialValues?: DealFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<DealFormValues>(initialValues ?? emptyDealForm);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof DealFormValues>(key: K, value: DealFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(name: string) {
    set("name", name);
    if (!slugTouched) {
      set("slug", slugify(name));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...values,
      raiseGoal: Number(values.raiseGoal),
      raisedAmount: Number(values.raisedAmount),
      minimumInvestment: Number(values.minimumInvestment),
      closeDate: values.closeDate || null,
      marketOpportunityNarrative: values.marketOpportunityNarrative || null,
    };

    const res = await fetch(mode === "create" ? "/api/deals" : `/api/deals/${dealId}`, {
      method: mode === "create" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(extractErrorMessage(body?.error));
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-16">
      <Section title="Basic Info">
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Deal Name" value={values.name} onChange={handleNameChange} />
          <div>
            <label
              htmlFor="slug-url"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary"
            >
              Slug (URL)
            </label>
            <input
              id="slug-url"
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
              className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
            />
          </div>
          <TextField
            label="Subheader"
            value={values.subheader}
            onChange={(v) => set("subheader", v)}
            placeholder="e.g. Enterprise AI Infrastructure"
          />
          <div>
            <label
              htmlFor="status"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary"
            >
              Status
            </label>
            <select
              id="status"
              value={values.status}
              onChange={(e) => set("status", e.target.value as "LIVE" | "CLOSED")}
              className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
            >
              <option value="LIVE">Live</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="sector"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary"
            >
              Sector
            </label>
            <select
              id="sector"
              value={values.sector}
              onChange={(e) => set("sector", e.target.value)}
              className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
            >
              {Object.entries(SECTOR_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="offering-type"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary"
            >
              Offering Type
            </label>
            <select
              id="offering-type"
              value={values.offeringType}
              onChange={(e) => set("offeringType", e.target.value)}
              className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
            >
              {Object.entries(OFFERING_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {values.status === "CLOSED" && (
            <TextField
              label="Close Date"
              type="month"
              value={values.closeDate}
              onChange={(v) => set("closeDate", v)}
            />
          )}
        </div>
      </Section>

      <Section title="Images">
        <div className="flex flex-wrap gap-8">
          <ImageUploadField
            label="Company Logo"
            kind="logo"
            value={values.logoUrl}
            onChange={(url) => set("logoUrl", url)}
          />
          <ImageUploadField
            label="Card Thumbnail"
            kind="thumbnail"
            value={values.thumbnailUrl}
            onChange={(url) => set("thumbnailUrl", url)}
          />
        </div>
        <div className="mt-6">
          <ImageUploadField
            label="Landing Page Banner (shown semi-transparent behind the hero)"
            kind="banner"
            aspect="wide"
            value={values.bannerImageUrl}
            onChange={(url) => set("bannerImageUrl", url)}
          />
        </div>
      </Section>

      <Section title="Deal Representative">
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Rep Name" value={values.repName} onChange={(v) => set("repName", v)} />
          <TextField label="Rep Email" value={values.repEmail} onChange={(v) => set("repEmail", v)} />
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Rep Email is <span className="font-semibold text-brand-red">internal only</span> — stored
          for the team&rsquo;s reference and never shown anywhere on the public site.
        </p>
        <div className="mt-6">
          <ImageUploadField
            label="Headshot (square works best — initials shown if empty)"
            kind="logo"
            value={values.repPhotoUrl}
            onChange={(url) => set("repPhotoUrl", url)}
          />
        </div>
      </Section>

      <Section title="Numbers">
        <div className="grid grid-cols-3 gap-4">
          <TextField
            label="Raise Goal ($)"
            type="number"
            value={values.raiseGoal}
            onChange={(v) => set("raiseGoal", v)}
          />
          <TextField
            label="Raised So Far ($)"
            type="number"
            value={values.raisedAmount}
            onChange={(v) => set("raisedAmount", v)}
          />
          <TextField
            label="Minimum Investment ($)"
            type="number"
            value={values.minimumInvestment}
            onChange={(v) => set("minimumInvestment", v)}
          />
        </div>
        {values.status === "CLOSED" && (
          <label className="mt-4 flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={values.raisedAmountUndisclosed}
              onChange={(e) => set("raisedAmountUndisclosed", e.target.checked)}
            />
            Undisclosed Amount — hide the raised amount on the public site and
            show &ldquo;Undisclosed Amount&rdquo; instead
          </label>
        )}
      </Section>

      <Section title="Company Overview">
        <textarea
          aria-label="Company Overview"
          value={values.companyOverview}
          onChange={(e) => set("companyOverview", e.target.value)}
          rows={5}
          placeholder="Full overview shown on the landing page; the card shows a clipped preview of this text."
          className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
        />
      </Section>

      <Section title="Landing Page Details">
        <p className="mb-4 text-xs text-ink-secondary">
          Shown in the sidebar, below Offering Type / Minimum Investment /
          Sector / Issuer. Add whatever fields apply to this deal — e.g.
          Investment Vehicle, Regulation, Hold Period.
        </p>
        <LabelValueListField
          items={values.sidebarFields}
          onChange={(items) => set("sidebarFields", items)}
        />
      </Section>

      <Section title="Investment Snapshot">
        <LabelValueListField
          items={values.snapshotFields}
          onChange={(items) => set("snapshotFields", items)}
        />
      </Section>

      <Section title="Why Invest">
        <BulletListField
          items={values.whyInvestBullets}
          onChange={(items) => set("whyInvestBullets", items)}
        />
      </Section>

      <Section title="Market Opportunity">
        <LabelValueListField
          items={values.marketStats}
          onChange={(items) => set("marketStats", items)}
          labelPlaceholder="Stat label (e.g. Total Addressable Market)"
          valuePlaceholder="Value (e.g. $84B)"
          addLabel="Add Stat"
        />
        <div className="mt-4">
          <label
            htmlFor="market-opportunity-narrative"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary"
          >
            Narrative
          </label>
          <textarea
            id="market-opportunity-narrative"
            value={values.marketOpportunityNarrative}
            onChange={(e) => set("marketOpportunityNarrative", e.target.value)}
            rows={3}
            className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
          />
        </div>
      </Section>

      <Section title="Leadership">
        <LeadershipListField
          items={values.leadership}
          onChange={(items) => set("leadership", items)}
        />
      </Section>

      <Section title="Frequently Asked Questions">
        <FaqListField items={values.faqs} onChange={(items) => set("faqs", items)} />
      </Section>

      {error && (
        <p className="border border-brand-red bg-brand-red/5 px-4 py-3 text-sm text-brand-red">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="border border-navy-950 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-navy-950 hover:bg-navy-950/5"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-red-dark disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save Deal"}
        </button>
      </div>
    </form>
  );
}
