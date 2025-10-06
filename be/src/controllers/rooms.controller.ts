import { Request, Response } from "express";
import emailService, { EmailInviteData } from "../services/email.service";

export const sendInvitations = async (req: Request, res: Response) => {
  try {
    const inviteData: EmailInviteData = req.body;

    // Validate required fields
    if (
      !inviteData.emails ||
      !Array.isArray(inviteData.emails) ||
      inviteData.emails.length === 0
    ) {
      return res.status(400).json({
        error: "Email addresses are required",
        message: "Please provide at least one email address",
      });
    }

    if (!inviteData.senderName || !inviteData.senderName.trim()) {
      return res.status(400).json({
        error: "Sender name is required",
        message: "Please provide the sender name",
      });
    }

    if (!inviteData.inviteLink) {
      return res.status(400).json({
        error: "Invite link is required",
        message: "Invite link is missing",
      });
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = inviteData.emails.filter(
      (email) => !emailRegex.test(email)
    );

    if (invalidEmails.length > 0) {
      return res.status(400).json({
        error: "Invalid email addresses",
        message: "Some email addresses are not valid",
        invalidEmails,
      });
    }

    // Send invitations
    await emailService.sendInvitations(inviteData);

    res.status(200).json({
      success: true,
      message: `Invitations sent successfully to ${inviteData.emails.length} recipients`,
      emailCount: inviteData.emails.length,
    });
  } catch (error) {
    console.error("Failed to send invitations:", error);
    res.status(500).json({
      error: "Failed to send invitations",
      message:
        "An error occurred while sending the invitations. Please try again.",
    });
  }
};
