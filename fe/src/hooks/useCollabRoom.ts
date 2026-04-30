import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCollab } from "@/contexts/CollabContext";
import { generateRoomId } from "@/helpers/collab.h";

export const useCollabRoom = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const roomId = searchParams.get("room") || generateRoomId();
  const initialUserName = searchParams.get("name") || "";
  const { state, joinRoom } = useCollab();

  const [userName, setUserName] = useState(initialUserName);
  const [isModalOpen, setIsModalOpen] = useState(!initialUserName);
  const joinRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId || !userName || isModalOpen || state.isCollaborating) {
      return;
    }

    const joinKey = `${roomId}:${userName}`;
    if (joinRequestRef.current === joinKey) {
      return;
    }

    joinRequestRef.current = joinKey;
    console.log("Joining room:", roomId, "with name:", userName);
    joinRoom(roomId, userName);
  }, [roomId, userName, isModalOpen, state.isCollaborating, joinRoom]);

  const handleJoin = () => {
    if (userName.trim()) {
      setSearchParams({ room: roomId, name: userName });
      setIsModalOpen(false);
    }
  };

  return {
    roomId,
    userName,
    setUserName,
    isModalOpen,
    setIsModalOpen,
    handleJoin,
    state,
  };
};
