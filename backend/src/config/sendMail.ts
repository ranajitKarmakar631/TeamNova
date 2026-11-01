import nodemailer, { Transporter } from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

export interface SendInvitationEmailParams {
  to: string;
  inviterName: string;
  workspaceName: string;
  role: string;
  inviteUrl: string;
  expiresInDays?: number;
}

let cachedTransporter: Transporter | null = null;

const getTransporter = async (): Promise<Transporter> => {
  if (cachedTransporter) return cachedTransporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      await transporter.verify();
      cachedTransporter = transporter;
      return cachedTransporter;
    } catch (err) {
      console.warn(
        "Configured Ethereal SMTP credentials invalid or expired. Creating automatic test account..."
      );
    }
  }

  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("Created fresh Ethereal test account:", testAccount.user);
    return cachedTransporter;
  } catch (error) {
    console.error("Failed to create Ethereal test account:", error);
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: process.env.EMAIL_USER || "test@ethereal.email",
        pass: process.env.EMAIL_PASSWORD || "test",
      },
    });
  }
};

export const sendEmail = async (options: string | SendEmailOptions) => {
  const mailOptions =
    typeof options === "string"
      ? {
          to: options,
          subject: "TaskNova Notification",
          text: "Greetings from the TaskNova team.",
          html: `
            <h1>Greetings from TaskNova</h1>
            <p>You received this message from TaskNova notification service.</p>
          `,
        }
      : options;

  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: `"TaskNova" <${process.env.EMAIL_USER || "no-reply@tasknova.com"}>`,
    to: mailOptions.to,
    subject: mailOptions.subject,
    text: mailOptions.text || mailOptions.subject,
    html: mailOptions.html,
  });

  console.log("Email sent:", info.messageId);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log("Preview URL (Ethereal): %s", previewUrl);
  }

  return info;
};

export const sendInvitationEmail = async ({
  to,
  inviterName,
  workspaceName,
  role,
  inviteUrl,
  expiresInDays = 7,
}: SendInvitationEmailParams) => {
  const subject = `${inviterName} invited you to join ${workspaceName} on TaskNova`;
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Workspace Invitation</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f4f5f7;
          color: #333333;
        }
        .container {
          max-width: 580px;
          margin: 32px auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.07);
          border: 1px solid #e5e7eb;
        }
        .header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          padding: 32px 36px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          font-size: 26px;
          margin: 0;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .header p {
          color: rgba(255, 255, 255, 0.85);
          font-size: 14px;
          margin: 6px 0 0 0;
        }
        .body {
          padding: 36px;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 16px;
        }
        .description {
          font-size: 15px;
          line-height: 1.6;
          color: #4b5563;
          margin-bottom: 24px;
        }
        .invite-box {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 18px 20px;
          margin-bottom: 28px;
        }
        .invite-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 14px;
        }
        .label {
          color: #6b7280;
        }
        .value {
          font-weight: 600;
          color: #111827;
        }
        .badge {
          display: inline-block;
          background-color: #ede9fe;
          color: #6d28d9;
          font-weight: 700;
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 9999px;
          text-transform: uppercase;
        }
        .cta-container {
          text-align: center;
          margin: 32px 0 24px 0;
        }
        .cta-btn {
          display: inline-block;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: #ffffff !important;
          text-decoration: none;
          font-size: 16px;
          font-weight: 600;
          padding: 14px 36px;
          border-radius: 8px;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
        }
        .fallback {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
          margin-top: 24px;
          word-break: break-all;
          border-top: 1px solid #f3f4f6;
          padding-top: 16px;
        }
        .fallback a {
          color: #4f46e5;
        }
        .footer {
          background-color: #fafafa;
          border-top: 1px solid #f3f4f6;
          padding: 20px 36px;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TaskNova</h1>
          <p>Collaborative Workspace Platform</p>
        </div>
        <div class="body">
          <div class="greeting">Hello!</div>
          <p class="description">
            <strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace on TaskNova.
          </p>
          <div class="invite-box">
            <table width="100%" cellpadding="6" cellspacing="0">
              <tr>
                <td style="color: #6b7280; font-size: 14px;">Workspace:</td>
                <td style="font-weight: 600; font-size: 14px; text-align: right; color: #111827;">${workspaceName}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-size: 14px;">Assigned Role:</td>
                <td style="font-weight: 600; font-size: 14px; text-align: right;">
                  <span class="badge">${role}</span>
                </td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-size: 14px;">Expires:</td>
                <td style="font-size: 14px; text-align: right; color: #6b7280;">In ${expiresInDays} days</td>
              </tr>
            </table>
          </div>
          <div class="cta-container">
            <a href="${inviteUrl}" class="cta-btn" target="_blank">Accept Invitation</a>
          </div>
          <div class="fallback">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${inviteUrl}">${inviteUrl}</a>
          </div>
        </div>
        <div class="footer">
          This invitation was sent to ${to}. If you did not expect this invitation, you can safely ignore this email.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    text: `${inviterName} invited you to join ${workspaceName} on TaskNova as ${role}. Accept your invitation here: ${inviteUrl}`,
    html,
  });
};