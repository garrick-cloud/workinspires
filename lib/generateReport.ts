// /app/lib/generateReport.ts
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Define an interface for type safety if you are using TypeScript
export interface SubmissionData {
  id: string;
  participantName: string;
  program: string;
  assignmentName: string;
  score: number | null;
  reviewedAt: string | null;
}

export const generateIndividualPDF = (sub: SubmissionData): void => {
  // Guard clause against server-side rendering execution
  if (typeof window === "undefined") return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  // Banner Header
  doc.setFillColor(71, 85, 105);
  doc.rect(0, 0, 216, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("WORKINSPIRE SUMMARY REPORT", 15, 22);

  // Metadata Info
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 15, 45);

  const reportRows = [
    ["Participant Name", sub.participantName],
    ["Program / Track", sub.program],
    ["Assignment Title", sub.assignmentName],
    ["Evaluation Score", sub.score !== null ? `${sub.score} / 100` : "Ungraded"],
    ["Submission / Review Date", sub.reviewedAt ? sub.reviewedAt : "—"],
  ];

  // Build Table
  (doc as any).autoTable({
    startY: 50,
    theme: "striped",
    headStyles: { fillColor: [71, 85, 105] },
    bodyStyles: { fontSize: 11, cellPadding: 6 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60, textColor: [71, 85, 105] },
      1: { textColor: [30, 41, 59] },
    },
    body: reportRows,
  });

  const finalY = (doc as any).lastAutoTable.finalY || 120;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, finalY + 10, 201, finalY + 10);
  
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Confidential - Generated via WorkInspire Analytics Engine", 15, finalY + 18);

  const cleanName = sub.participantName.replace(/[^a-z0-9]/gi, "_");
  const cleanAssignment = sub.assignmentName.replace(/[^a-z0-9]/gi, "_");
  doc.save(`Report_${cleanName}_${cleanAssignment}.pdf`);
};