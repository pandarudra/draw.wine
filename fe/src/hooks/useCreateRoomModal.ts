import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateRoomId } from "@/helpers/collab.h";

export const useCreateRoomModal = () => {
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState("");
  const [onlyHostCanDraw, setOnlyHostCanDraw] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!roomName.trim() || !userName.trim()) return;

    setIsCreating(true);

    try {
      const newRoomId = generateRoomId();
      setRoomId(newRoomId);
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartCollab = () => {
    if (!roomId) return;

    const collabUrl = `/collab?room=${roomId}&name=${encodeURIComponent(
      userName.trim(),
    )}${onlyHostCanDraw ? "&onlyHostCanDraw=true" : ""}${requireApproval ? "&requireApproval=true" : ""}`;

    navigate(collabUrl);

    setRoomName("");
    setUserName("");
    setOnlyHostCanDraw(false);
    setRequireApproval(false);
  };

  const handleCopyInvite = async () => {
    if (!roomId) return;
    const inviteUrl = `${window.location.origin}/collab?room=${roomId}&name=${onlyHostCanDraw ? "&onlyHostCanDraw=true" : ""}${requireApproval ? "&requireApproval=true" : ""}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyRoomId = async () => {
    if (!roomId) return;
    await navigator.clipboard.writeText(roomId);
    setCopiedRoomId(true);
    setTimeout(() => setCopiedRoomId(false), 2000);
  };

  return {
    roomName,
    setRoomName,
    userName,
    setUserName,
    onlyHostCanDraw,
    setOnlyHostCanDraw,
    requireApproval,
    setRequireApproval,
    isCreating,
    roomId,
    copied,
    copiedRoomId,
    handleCreate,
    handleStartCollab,
    handleCopyInvite,
    handleCopyRoomId,
  };
};
