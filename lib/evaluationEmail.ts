function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderEvaluationEmail({
  assignmentName,
  participantName,
  dueDate,
  evaluationUrl,
}: {
  assignmentName: string;
  participantName: string;
  dueDate: string;
  evaluationUrl: string;
}) {
  const safeAssignmentName = escapeHtml(assignmentName);
  const safeParticipantName = escapeHtml(participantName || 'Participant');
  const safeDueDate = escapeHtml(dueDate || 'Open');
  const safeEvaluationUrl = escapeHtml(evaluationUrl);

  return `
    <div style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #dbe4f0;border-radius:14px;overflow:hidden;box-shadow:0 12px 28px rgba(15,23,42,0.08);">
              <tr>
                <td style="background:#0f172a;padding:24px 28px;">
                  <div style="font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#93c5fd;font-weight:700;">WorkInspires</div>
                  <div style="font-size:22px;line-height:1.35;color:#ffffff;font-weight:700;margin-top:8px;">New evaluation assigned</div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">Hello ${safeParticipantName},</p>
                  <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#334155;">You have a private evaluation ready. Use the button below to open your individual form link.</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;margin-bottom:24px;">
                    <tr>
                      <td style="padding:16px 18px;border-bottom:1px solid #e2e8f0;">
                        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:#64748b;font-weight:700;margin-bottom:5px;">Assignment</div>
                        <div style="font-size:16px;color:#0f172a;font-weight:700;">${safeAssignmentName}</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:16px 18px;">
                        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:#64748b;font-weight:700;margin-bottom:5px;">Due date</div>
                        <div style="font-size:15px;color:#0f172a;font-weight:600;">${safeDueDate}</div>
                      </td>
                    </tr>
                  </table>
                  <div style="text-align:center;margin:28px 0;">
                    <a href="${safeEvaluationUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:9px;">Open Evaluation</a>
                  </div>
                  <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">This link is unique to you. Please do not forward it.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.5;color:#64748b;">
                  If the button does not work, copy and paste this link into your browser:<br />
                  <a href="${safeEvaluationUrl}" style="color:#2563eb;word-break:break-all;">${safeEvaluationUrl}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}
