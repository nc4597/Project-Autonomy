import { FormConfigEditor } from "@/components/FormConfigEditor";

export const dynamic = "force-dynamic";

export default function VerificationFormPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ink">Verification Form</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Edit the fields investors fill out during KYC/AML verification. Changes stay in draft
          until you publish; in-flight investor drafts are unaffected.
        </p>
      </div>
      <FormConfigEditor />
    </div>
  );
}
