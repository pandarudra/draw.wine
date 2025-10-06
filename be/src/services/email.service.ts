import nodemailer from "nodemailer";

export interface EmailInviteData {
  emails: string[];
  senderName: string;
  message: string;
  roomId?: string;
  roomName: string;
  inviteLink: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;
  private isDevelopment: boolean = true;

  constructor() {
    this.isDevelopment = (process.env.NODE_ENV as string) !== "prod";

    // Validate environment variables
    const emailConfig = this.validateEmailConfig();
    if (!emailConfig.isValid && !this.isDevelopment) {
      console.warn(
        "⚠️  Email service: Invalid configuration. Running in simulation mode."
      );
      console.warn(`Missing: ${emailConfig.missing.join(", ")}`);
      this.isConfigured = false;
    } else {
      this.initializeTransporter();
    }
  }

  private validateEmailConfig(): { isValid: boolean; missing: string[] } {
    const missing: string[] = [];

    if (!process.env.EMAIL) {
      missing.push("EMAIL");
    } else if (!this.isValidEmail(process.env.EMAIL)) {
      missing.push("EMAIL (invalid format)");
    }

    if (!process.env.OTP_PASS) {
      missing.push("OTP_PASS");
    }

    return {
      isValid: missing.length === 0,
      missing,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private initializeTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL,
          pass: process.env.OTP_PASS?.trim(),
        },
      });

      this.isConfigured = true;
      console.log("✅ Email service initialized with SMTP transporter");
    } catch (error) {
      console.error("❌ Failed to initialize email transporter:", error);
      this.isConfigured = false;
    }
  }

  async sendInvitations(inviteData: EmailInviteData): Promise<void> {
    const { emails, senderName, message, roomName, inviteLink } = inviteData;

    // If email service is not configured or in development mode, simulate sending
    if (!this.isConfigured || this.isDevelopment) {
      console.log("📧 Email service: Running in simulation mode");
      console.log("\n=== EMAIL INVITATION SIMULATION ===");
      console.log(`From: ${senderName}`);
      console.log(`Room: ${roomName}`);
      console.log(`Recipients: ${emails.join(", ")}`);
      console.log(`Link: ${inviteLink}`);
      if (message) {
        console.log(`Message: ${message}`);
      }
      console.log("======================================\n");

      // Simulate sending to each email with detailed logging
      for (const email of emails) {
        console.log(
          `✅ Simulated email sent to ${email}: message-id-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(
        `✅ Successfully simulated sending ${emails.length} invitation emails`
      );
      return;
    }

    // Send actual emails in production

    try {
      if (!this.transporter) {
        throw new Error("Email transporter not initialized");
      }

      const emailPromises = emails.map(async (email) => {
        const info = await this.transporter!.sendMail({
          from: process.env.EMAIL as string,
          to: email,
          subject: `${senderName} invited you to collaborate on "${roomName}"`,
          html: this.generateEmailTemplate(
            senderName,
            message,
            roomName,
            inviteLink
          ),
          text: this.generatePlainTextEmail(
            senderName,
            message,
            roomName,
            inviteLink
          ),
        });
        console.log(`✅ Email sent to ${email}:`, info);
        return info;
      });

      await Promise.all(emailPromises);
      console.log(`✅ Successfully sent ${emails.length} invitation emails`);
    } catch (error) {
      console.error("❌ Error sending emails:", error);
      throw new Error(
        `Failed to send invitation emails: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private generateEmailTemplate(
    senderName: string,
    message: string,
    roomName: string,
    inviteLink: string
  ): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Invitation to Collaborate</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f9fafb;
          color: #111827;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .header {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          padding: 32px;
          text-align: center;
          color: #ffffff;
        }
        .logo {
          font-size: 26px;
          font-weight: bold;
          margin-bottom: 6px;
        }
        .title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }
        .content {
          padding: 28px;
        }
        .room-info {
          background-color: #eef2ff;
          border: 1px solid #c7d2fe;
          padding: 14px 18px;
          border-radius: 8px;
          margin: 18px 0;
          font-size: 16px;
          font-weight: 500;
          color: #1f2937;
        }
        .message-box {
          background: #f9fafb;
          border-left: 4px solid #6366f1;
          padding: 16px 20px;
          margin: 22px 0;
          border-radius: 6px;
          color: #374151;
          font-size: 15px;
          line-height: 1.5;
        }
        .invite-button {
          display: inline-block;
          background: #6366f1;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 26px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          margin: 24px 0;
          transition: background 0.25s ease;
        }
        .invite-button:hover {
          background: #4f46e5;
        }
        .link-fallback {
          font-size: 14px;
          color: #374151;
          margin-top: 24px;
          word-break: break-all;
        }
        .footer {
          background: #f9fafb;
          padding: 20px;
          text-align: center;
          font-size: 13px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        @media (max-width: 600px) {
          .content {
            padding: 20px;
          }
          .invite-button {
            width: 100%;
            text-align: center;
            display: block;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎨 draw.wine</div>
          <h1 class="title">Collaboration Invitation</h1>
        </div>
        <div class="content">
          <p style="font-size:15px; color:#374151;">
            <strong>${senderName}</strong> has invited you to join a collaborative drawing session.
          </p>

          <div class="room-info">
            <strong>Room:</strong> ${roomName}
          </div>

          ${
            message
              ? `
              <div class="message-box">
                <strong>Personal message from ${senderName}:</strong>
                <p>${message}</p>
              </div>
            `
              : ""
          }

          <div style="text-align:center;">
            <a href="${inviteLink}" class="invite-button">Join Drawing Room</a>
          </div>

          <p style="font-size: 15px; color: #374151;">
            Click the button above to start drawing together in real-time.
          </p>

          <div class="link-fallback">
            <p>If the button doesn’t work, copy and paste this link into your browser:</p>
            <div>${inviteLink}</div>
          </div>
        </div>
        <div class="footer">
          <p>Sent via <strong>draw.wine</strong> — collaborate, sketch, and create in real-time.</p>
          <p>If this invitation is unexpected, you can safely ignore it.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  }

  private generatePlainTextEmail(
    senderName: string,
    message: string,
    roomName: string,
    inviteLink: string
  ): string {
    return `
🎨 You're invited to collaborate on draw.wine!

${senderName} has invited you to collaborate in the room: "${roomName}".

${
  message ? `Message from ${senderName}:\n"${message}"\n\n` : ""
}Join the drawing session using this link:
${inviteLink}

You'll be able to sketch and collaborate together in real-time.

—
Sent via draw.wine — the collaborative drawing platform.
If you didn’t expect this invitation, you can safely ignore this email.
  `.trim();
  }

  // Method to test email configuration
  async testConnection(): Promise<boolean> {
    try {
      // In development mode, just check if configuration is valid
      if (this.isDevelopment) {
        console.log("📧 Email service test: OK (development mode)");
        return true;
      }

      // In production, verify the actual SMTP connection
      if (!this.transporter || !this.isConfigured) {
        console.error(
          "📧 Email service test: FAILED - Transporter not configured"
        );
        return false;
      }

      // Verify the transporter connection
      await this.transporter.verify();
      console.log("📧 Email service test: OK (SMTP connection verified)");
      return true;
    } catch (error) {
      console.error("📧 Email service connection failed:", error);
      return false;
    }
  }

  // Method to get configuration status for debugging
  getConfigurationStatus(): {
    isConfigured: boolean;
    isDevelopment: boolean;
    hasValidTransporter: boolean;
    emailConfigured: boolean;
  } {
    return {
      isConfigured: this.isConfigured,
      isDevelopment: this.isDevelopment,
      hasValidTransporter: this.transporter !== null,
      emailConfigured: !!process.env.EMAIL && !!process.env.OTP_PASS,
    };
  }
}

export default new EmailService();
