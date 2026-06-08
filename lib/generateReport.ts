import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { SubmissionAnswer, SubmissionDetail } from "@/lib/dashboardTypes";

type AutoTableDoc = jsPDF & {
  lastAutoTable?: { finalY?: number };
};

function formatAnswerValue(value: SubmissionAnswer["value"]) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

export const generateIndividualPDF = (submission: SubmissionDetail): void => {
  if (typeof window === "undefined") return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  }) as AutoTableDoc;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 216, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("WORKINSPIRES SUBMISSION REPORT", 15, 22);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 15, 45);

  const reportRows = [
    ["Submission ID", submission.id],
    ["Participant Name", submission.participantName],
    ["Participant Email", submission.participantEmail ?? "-"],
    ["Company", submission.companyName],
    ["Form", submission.formName],
    ["Assignment", submission.assignmentName],
    ["Status", submission.status],
    ["Score", submission.score !== null ? `${submission.score} / 100` : "Ungraded"],
    ["Admin Remark", submission.adminRemark || "Not Reviewed"],
    ["Admin Review Notes", submission.adminComment || "-"],
    ["Due Date", submission.dueDate ? new Date(submission.dueDate).toLocaleDateString() : "Open"],
    ["Submitted / Reviewed", submission.reviewedAt ? new Date(submission.reviewedAt).toLocaleString() : "-"],
  ];

  autoTable(doc, {
    startY: 50,
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42] },
    bodyStyles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 58, textColor: [71, 85, 105] },
      1: { textColor: [30, 41, 59] },
    },
    body: reportRows,
  });

  let finalY = doc.lastAutoTable?.finalY || 120;
  const answers = Array.isArray(submission.answers) ? submission.answers : [];
  const answerRows = answers.map((answer) => [
    answer.label,
    formatAnswerValue(answer.value),
    answer.pointsEarned !== undefined ? String(answer.pointsEarned) : "-",
  ]);

  if (answerRows.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("Submitted Answers", 15, finalY + 14);

    autoTable(doc, {
      startY: finalY + 20,
      theme: "grid",
      head: [["Question", "Answer", "Points"]],
      headStyles: { fillColor: [37, 99, 235] },
      bodyStyles: { fontSize: 9, cellPadding: 4, valign: "top" },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: "bold", textColor: [30, 41, 59] },
        1: { cellWidth: 86, textColor: [30, 41, 59] },
        2: { cellWidth: 20, halign: "center" },
      },
      body: answerRows,
    });

    finalY = doc.lastAutoTable?.finalY || finalY + 20;
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(15, finalY + 10, 201, finalY + 10);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Confidential - Generated from the WorkInspires submissions database", 15, finalY + 18);

  const cleanName = submission.participantName.replace(/[^a-z0-9]/gi, "_");
  const cleanAssignment = submission.assignmentName.replace(/[^a-z0-9]/gi, "_");
  doc.save(`Report_${cleanName}_${cleanAssignment}.pdf`);
};
