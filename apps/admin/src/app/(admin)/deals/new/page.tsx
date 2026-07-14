import { DealForm } from "@/components/DealForm";

export default function NewDealPage() {
  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl text-ink">Add Deal</h1>
      <DealForm mode="create" />
    </div>
  );
}
