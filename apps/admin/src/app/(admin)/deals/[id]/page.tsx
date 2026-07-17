import { notFound } from "next/navigation";
import { getDealById } from "@/lib/dealRepository";
import { DealForm, type DealFormValues } from "@/components/DealForm";

export const dynamic = "force-dynamic";

export default async function EditDealPage({ params }: { params: { id: string } }) {
  const deal = await getDealById(params.id);
  if (!deal) notFound();

  const initialValues: DealFormValues = {
    slug: deal.slug,
    status: deal.status,
    name: deal.name,
    subheader: deal.subheader,
    sector: deal.sector,
    offeringType: deal.offeringType,
    logoUrl: deal.logoUrl,
    thumbnailUrl: deal.thumbnailUrl,
    bannerImageUrl: deal.bannerImageUrl,
    repName: deal.repName ?? "",
    repPhotoUrl: deal.repPhotoUrl,
    repEmail: deal.repEmail ?? "",
    raiseGoal: String(deal.raiseGoal),
    raisedAmount: String(deal.raisedAmount),
    raisedAmountUndisclosed: deal.raisedAmountUndisclosed,
    minimumInvestment: String(deal.minimumInvestment),
    companyOverview: deal.companyOverview,
    closeDate: deal.closeDate ? deal.closeDate.toISOString().slice(0, 7) : "",
    marketOpportunityNarrative: deal.marketOpportunityNarrative ?? "",
    sidebarFields: deal.sidebarFields.map((f) => ({ id: f.id, label: f.label, value: f.value })),
    snapshotFields: deal.snapshotFields.map((f) => ({ id: f.id, label: f.label, value: f.value })),
    whyInvestBullets: deal.whyInvestBullets.map((b) => ({ id: b.id, text: b.text })),
    marketStats: deal.marketStats.map((s) => ({ id: s.id, label: s.label, value: s.value })),
    leadership: deal.leadership.map((l) => ({
      id: l.id,
      name: l.name,
      title: l.title,
      bio: l.bio,
      photoUrl: l.photoUrl,
    })),
    faqs: deal.faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
  };

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl text-ink">Edit Deal</h1>
      <DealForm mode="edit" dealId={deal.id} initialValues={initialValues} />
    </div>
  );
}
