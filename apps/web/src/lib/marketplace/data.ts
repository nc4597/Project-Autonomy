import type { FaqItem } from "./types";

/**
 * Home page FAQ copy — not yet backed by the admin CMS (only deal
 * content and site KPIs/featured selections are), still hand-edited
 * here for now.
 */
export const homeFaqs: FaqItem[] = [
  {
    question: "Who can invest through Regiment Marketplace?",
    answer:
      "Regiment Marketplace is available exclusively to accredited investors as defined by the SEC. You'll complete a verification process to confirm accredited status before accessing full deal materials or investing in any offering.",
  },
  {
    question: "What types of offerings are available?",
    answer:
      "Offerings include Reg D 506(c) private placements, Reg A offerings, LP placements, venture investments, and fund vehicles across sectors such as AI, healthcare, energy, fintech, defense, infrastructure, and real estate.",
  },
  {
    question: "What is the minimum investment?",
    answer:
      "Minimum investments vary by offering, typically ranging from $25,000 to $250,000. Each deal's specific minimum is listed on its overview page.",
  },
  {
    question: "How does the verification process work?",
    answer:
      "After expressing interest in a deal, you'll complete a secure multi-step verification covering contact information, identity (KYC/AML), and accredited investor status. Our compliance team typically completes review within 1-2 business days.",
  },
  {
    question: "Is Regiment Securities a registered broker-dealer?",
    answer:
      "Yes. Regiment Securities LLC is a registered broker-dealer and member of FINRA/SIPC. All offerings on the marketplace are reviewed for regulatory compliance before listing.",
  },
  {
    question: "What happens after I express interest in a deal?",
    answer:
      "Once your verification is approved, a dedicated Regiment Securities representative will contact you directly to guide you through deal documents, the data room, and funding.",
  },
];
