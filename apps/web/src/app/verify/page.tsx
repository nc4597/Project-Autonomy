"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "../../components/ui/Container";

// The deal-landing-page button links here with ?dealId=..., we redirect
// into the canonical /verify/[dealId] route so the whole wizard lives at
// one bookmarkable, shareable URL.
export default function VerifyRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const dealId = searchParams.get("dealId");
    if (dealId) {
      router.replace(`/verify/${encodeURIComponent(dealId)}`);
    }
  }, [router, searchParams]);

  const dealId = searchParams.get("dealId");
  if (!dealId) {
    return (
      <Container className="py-16 text-center text-sm text-ink-secondary">
        Missing deal reference. Please return to the deal page and click &ldquo;I&rsquo;m Interested&rdquo;
        again.
      </Container>
    );
  }

  return null;
}
