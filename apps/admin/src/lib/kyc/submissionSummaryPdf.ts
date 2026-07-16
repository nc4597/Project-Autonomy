import PDFDocument from "pdfkit";
import type { SubmissionWithRelations } from "./hubspotService";

function humanize(enumValue: string): string {
  return enumValue
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Renders a PDF summarizing every submitted answer, so a reviewer can
 * see the full picture (documents + answers) inside the investor's
 * HubSpot folder without also opening the Contact record. Includes SSN
 * (last 4) and date of birth per explicit instruction — scoped
 * deliberately to this one private PDF only, not to the HubSpot
 * Contact/Forms sync (see hubspotService.ts's buildContactProperties),
 * which still excludes both so they never become searchable/exportable
 * CRM properties.
 */
export async function generateSubmissionSummaryPdf(submission: SubmissionWithRelations): Promise<Buffer> {
  const { contactInfo, kycAmlInfo, accreditation, documents, certification } = submission;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "LETTER" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    function section(title: string, rows: [string, string][]) {
      doc.fontSize(13).fillColor("#000").text(title, { underline: true });
      doc.moveDown(0.25);
      doc.fontSize(10);
      for (const [label, value] of rows) {
        doc.text(`${label}: ${value || "—"}`);
      }
      doc.moveDown();
    }

    doc.fontSize(18).text("Accredited Investor Verification Summary", { underline: true });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor("#666")
      .text(`Submission ID: ${submission.id}`)
      .text(`Deal ID: ${submission.dealId}`)
      .text(`Submitted At: ${submission.submittedAt?.toISOString() ?? "—"}`)
      .fillColor("#000");
    doc.moveDown();

    if (contactInfo) {
      section("Contact Information", [
        ["Name", `${contactInfo.firstName} ${contactInfo.lastName}`],
        ["Email", contactInfo.email],
        ["Phone", contactInfo.phone],
        ["Date of Birth", contactInfo.dateOfBirth.toISOString().slice(0, 10)],
        ["SSN (Last 4 Digits)", contactInfo.ssnLast4],
        ["Investor Type", humanize(contactInfo.investorType)],
        [
          "Address",
          `${contactInfo.streetAddress}, ${contactInfo.city}, ${contactInfo.state} ${contactInfo.zipCode}`,
        ],
      ]);
    }

    if (kycAmlInfo) {
      section("KYC / AML", [
        ["Country of Citizenship", kycAmlInfo.countryOfCitizenship],
        ["Tax Residence", kycAmlInfo.taxResidence],
        ["Source of Funds", humanize(kycAmlInfo.sourceOfFunds)],
      ]);
    }

    if (accreditation) {
      section("Accreditation", [["Method", humanize(accreditation.method)]]);
    }

    if (certification) {
      section("Certification", [
        ["Accepted At", certification.acceptedAt.toISOString()],
        ["Terms of Service Version", certification.tosVersion],
        ["IP Address", certification.ipAddress],
        ["User Agent", certification.userAgent],
      ]);
    }

    if (documents.length > 0) {
      section(
        "Documents Submitted",
        documents.map((d) => [humanize(d.category), `${d.originalFilename} (${d.status})`])
      );
    }

    doc.end();
  });
}
