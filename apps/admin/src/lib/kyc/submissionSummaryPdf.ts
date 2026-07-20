import PDFDocument from "pdfkit";
import type { SubmissionWithRelations } from "./serialize";

function humanize(enumValue: string): string {
  return enumValue
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Renders a PDF summarizing every submitted answer — the one-page
 * compliance view downloaded from the admin KYC detail page. Includes
 * SSN (last 4) and date of birth per explicit instruction; this PDF is
 * only ever served through the session-gated admin routes.
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
      const contactRows: [string, string][] = [
        ["Name", `${contactInfo.firstName} ${contactInfo.lastName}`],
        ["Email", contactInfo.email],
        ["Phone", contactInfo.phone],
        ["Date of Birth", contactInfo.dateOfBirth.toISOString().slice(0, 10)],
        [`${contactInfo.taxIdType} (Last 4 Digits)`, contactInfo.taxIdLast4],
        ["Investor Type", humanize(contactInfo.investorType)],
        [
          "Address",
          `${contactInfo.streetAddress}, ${contactInfo.city}, ${contactInfo.state} ${contactInfo.zipCode}`,
        ],
      ];
      if (contactInfo.investorType === "ENTITY_TRUST") {
        contactRows.push(["Entity / Trust Name", contactInfo.entityName ?? "—"]);
        contactRows.push(["Entity EIN (Last 4 Digits)", contactInfo.entityTaxIdLast4 ?? "—"]);
      }
      if (contactInfo.investorType === "JOINT") {
        contactRows.push([
          "Co-Owner",
          contactInfo.coOwnerFirstName ? `${contactInfo.coOwnerFirstName} ${contactInfo.coOwnerLastName ?? ""}`.trim() : "—",
        ]);
        contactRows.push(["Co-Owner Email", contactInfo.coOwnerEmail ?? "—"]);
        contactRows.push([
          "Co-Owner Date of Birth",
          contactInfo.coOwnerDateOfBirth?.toISOString().slice(0, 10) ?? "—",
        ]);
        contactRows.push([
          `Co-Owner ${contactInfo.coOwnerTaxIdType ?? "Tax ID"} (Last 4 Digits)`,
          contactInfo.coOwnerTaxIdLast4 ?? "—",
        ]);
        contactRows.push([
          "Co-Owner Address",
          contactInfo.coOwnerStreetAddress
            ? `${contactInfo.coOwnerStreetAddress}, ${contactInfo.coOwnerCity}, ${contactInfo.coOwnerState} ${contactInfo.coOwnerZipCode}`
            : "—",
        ]);
      }
      section("Contact Information", contactRows);
    }

    if (kycAmlInfo) {
      section("KYC / AML", [
        ["Country of Citizenship", kycAmlInfo.countryOfCitizenship],
        ["Tax Residence", kycAmlInfo.taxResidence],
        // Already a display label — the option list is admin-configurable.
        ["Source of Funds", kycAmlInfo.sourceOfFunds],
      ]);
    }

    if (accreditation) {
      section("Accreditation", [["Method", humanize(accreditation.method)]]);
    }

    if (submission.customAnswers.length > 0) {
      section(
        "Additional Questions",
        submission.customAnswers.map((a): [string, string] => [a.label, a.value])
      );
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
        documents.map((d): [string, string] => [humanize(d.category), `${d.originalFilename} (${d.status})`])
      );
    }

    doc.end();
  });
}
