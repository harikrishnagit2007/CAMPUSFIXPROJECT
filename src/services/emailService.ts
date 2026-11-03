import nodemailer from 'nodemailer';

export interface EmailLogEntry {
  id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  complaint_id: string;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  sent_at: string;
  preview_text: string;
}

const emailLogs: EmailLogEntry[] = [];

// Helper to initialize nodemailer transporter
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return null;
}

/**
 * Sends an automated email notification when a maintenance request is resolved.
 */
export async function sendResolutionEmail(payload: {
  complaint_id: string;
  complaint_title: string;
  category: string;
  location: string;
  student_name: string;
  student_email: string;
  resolution_notes?: string;
  staff_name?: string;
}): Promise<{ success: boolean; mode: 'SENT' | 'SIMULATED'; messageId?: string }> {
  const {
    complaint_id,
    complaint_title,
    category,
    location,
    student_name,
    student_email,
    resolution_notes,
    staff_name,
  } = payload;

  const recipientEmail = student_email || 'student@campusfix.edu';
  const recipientName = student_name || 'Student Member';
  const subject = `✅ CampusFix Alert: Maintenance Request ${complaint_id} is Resolved!`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 28px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.92; }
        .content { padding: 28px 24px; }
        .badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 13px; font-weight: 700; padding: 6px 12px; border-radius: 20px; margin-bottom: 16px; }
        .detail-table { width: 100%; border-collapse: collapse; margin: 18px 0; background: #f8fafc; border-radius: 8px; overflow: hidden; }
        .detail-table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .detail-table td.label { font-weight: 700; color: #475569; width: 35%; }
        .notes-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px; border-radius: 4px; font-size: 14px; color: #1e3a8a; margin-top: 16px; }
        .btn { display: block; width: 220px; margin: 24px auto 0; text-align: center; background: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 20px; border-radius: 8px; font-size: 15px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #f8fafc; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>CampusFix Maintenance Alert</h1>
          <p>Smart Campus Operations & Maintenance System</p>
        </div>
        <div class="content">
          <span class="badge">STATUS UPDATED: RESOLVED</span>
          <p style="font-size: 16px; margin-top: 0;">Dear <strong>${recipientName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.5;">Great news! The campus facilities team has completed repairs and marked your maintenance request as <strong>Resolved</strong>.</p>
          
          <table class="detail-table">
            <tr><td class="label">Ticket ID:</td><td><strong>${complaint_id}</strong></td></tr>
            <tr><td class="label">Issue Title:</td><td>${complaint_title}</td></tr>
            <tr><td class="label">Category:</td><td>${category}</td></tr>
            <tr><td class="label">Location:</td><td>${location}</td></tr>
            ${staff_name ? `<tr><td class="label">Assigned Technician:</td><td>${staff_name}</td></tr>` : ''}
            <tr><td class="label">Resolved At:</td><td>${new Date().toLocaleString()}</td></tr>
          </table>

          ${resolution_notes ? `
          <div class="notes-box">
            <strong>Technician Resolution Notes:</strong><br>
            "${resolution_notes}"
          </div>
          ` : ''}

          <p style="font-size: 14px; margin-top: 20px;">Please log into your Student Portal to verify the resolution and provide your feedback.</p>
          <a href="#" class="btn">Verify Resolution</a>
        </div>
        <div class="footer">
          CampusFix Maintenance System &bull; Automatic Notification Engine &bull; Rajalakshmi Educational Campus
        </div>
      </div>
    </body>
    </html>
  `;

  const logEntry: EmailLogEntry = {
    id: `EML-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    recipient_email: recipientEmail,
    recipient_name: recipientName,
    subject,
    complaint_id,
    status: 'SIMULATED',
    sent_at: new Date().toISOString(),
    preview_text: `Ticket ${complaint_id} resolved: ${complaint_title}`,
  };

  const transporter = createTransporter();

  if (transporter) {
    try {
      const fromAddr = process.env.SMTP_FROM || '"CampusFix Support" <no-reply@campusfix.edu>';
      const info = await transporter.sendMail({
        from: fromAddr,
        to: recipientEmail,
        subject,
        html: htmlContent,
      });

      logEntry.status = 'SENT';
      emailLogs.unshift(logEntry);
      if (emailLogs.length > 100) emailLogs.pop();

      console.log(`[CampusFix Email Service] Resolution email sent to ${recipientEmail} for ticket ${complaint_id}`);
      return { success: true, mode: 'SENT', messageId: info.messageId };
    } catch (err: any) {
      console.warn(`[CampusFix Email Service] SMTP error, falling back to simulated dispatch: ${err?.message || err}`);
    }
  }

  // Simulated email dispatch (for sandbox environments)
  logEntry.status = 'SIMULATED';
  emailLogs.unshift(logEntry);
  if (emailLogs.length > 100) emailLogs.pop();

  console.log(`[CampusFix Email Service - Simulated] Automated email queued for ${recipientEmail} (${subject})`);
  return { success: true, mode: 'SIMULATED' };
}

/**
 * Retrieves the history of automated email notifications sent by the system.
 */
export function getSentEmailLogs(): EmailLogEntry[] {
  return emailLogs;
}
