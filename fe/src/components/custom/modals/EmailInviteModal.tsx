import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Badge } from "../../ui/badge";
import { X, Mail, Plus } from "lucide-react";
import { toast } from "sonner";
import { be_url } from "@/env/e";

interface EmailInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  roomName?: string;
}

export const EmailInviteModal = ({
  isOpen,
  onClose,
  roomId,
  roomName,
}: EmailInviteModalProps) => {
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim().toLowerCase();

    if (!trimmedEmail) return;

    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (emails.includes(trimmedEmail)) {
      toast.error("Email address already added");
      return;
    }

    setEmails((prev) => [...prev, trimmedEmail]);
    setEmailInput("");
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails((prev) => prev.filter((email) => email !== emailToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleSendInvites = async () => {
    if (emails.length === 0) {
      toast.error("Please add at least one email address");
      return;
    }

    if (!senderName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsLoading(true);

    try {
      // Generate invitation link
      const baseUrl = window.location.origin;
      const inviteLink = roomId
        ? `${baseUrl}/collab-room?roomId=${roomId}&invite=true`
        : `${baseUrl}`;

      const inviteData = {
        emails,
        senderName: senderName.trim(),
        message: message.trim(),
        roomId,
        roomName: roomName || "Drawing Room",
        inviteLink,
      };

      // Send invitation emails via backend
      const response = await fetch(`${be_url}/api/rooms/send-invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inviteData),
      });

      console.log("Invitation response:", response);
      if (!response.ok) {
        throw new Error("Failed to send invitations");
      }

      toast.success(
        `Invitations sent to ${emails.length} email${
          emails.length > 1 ? "s" : ""
        }`
      );

      // Reset form
      setEmails([]);
      setEmailInput("");
      setMessage("");
      setSenderName("");
      onClose();
    } catch (error) {
      console.error("Failed to send invitations:", error);
      toast.error("Failed to send invitations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmails([]);
    setEmailInput("");
    setMessage("");
    setSenderName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Users via Email
          </DialogTitle>
          <DialogDescription>
            Send email invitations to collaborate on{" "}
            {roomName || "this drawing room"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sender Name Input */}
          <div className="space-y-2">
            <Label htmlFor="sender-name">Your Name</Label>
            <Input
              id="sender-name"
              placeholder="Enter your name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email-input">Email Addresses</Label>
            <div className="flex gap-2">
              <Input
                id="email-input"
                placeholder="Enter email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleAddEmail} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Press Enter or comma to add multiple emails
            </p>
          </div>

          {/* Email List */}
          {emails.length > 0 && (
            <div className="space-y-2">
              <Label>Recipients ({emails.length})</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {emails.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    <span>{email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveEmail(email)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to your invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Room Info */}
          {roomId && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="font-medium">Room Details:</div>
              <div>
                Room ID:{" "}
                <code className="text-xs bg-background px-1 py-0.5 rounded">
                  {roomId}
                </code>
              </div>
              {roomName && <div>Room Name: {roomName}</div>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSendInvites} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Invitations
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
