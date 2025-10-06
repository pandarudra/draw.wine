import { useState, useCallback, useContext } from "react";
import { CollabContext } from "@/contexts/CollabContext";
import { IsInARoom, hasRoomParams } from "@/lib/ext";
import type { RoomStatusResponse } from "@/lib/ext";

interface UseRoomStatusOptions {
  onStatusReceived?: (status: RoomStatusResponse) => void;
  onError?: (error: Error) => void;
}

export const useRoomStatus = (options: UseRoomStatusOptions = {}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [lastStatus, setLastStatus] = useState<RoomStatusResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const collabContext = useContext(CollabContext);
  const socket = collabContext?.state.socket;

  const checkRoomStatus = useCallback(
    async (
      roomId: string,
      userId: string
    ): Promise<RoomStatusResponse | null> => {
      if (!hasRoomParams(roomId, userId)) {
        const paramError = new Error("Invalid room parameters");
        setError(paramError);
        options.onError?.(paramError);
        return null;
      }

      if (!socket) {
        const socketError = new Error("No socket connection available");
        setError(socketError);
        options.onError?.(socketError);
        return null;
      }

      setIsChecking(true);
      setError(null);

      try {
        const status = await IsInARoom({
          params: { roomId, userId },
          _Socket: socket,
        });

        setLastStatus(status);
        options.onStatusReceived?.(status);

        return status;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Unknown error occurred");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsChecking(false);
      }
    },
    [socket, options]
  );

  const isUserInRoom = useCallback(
    (roomId: string, userId: string): boolean => {
      if (!collabContext?.state.isCollaborating) return false;

      return (
        collabContext.state.roomId === roomId &&
        collabContext.state.userId === userId &&
        collabContext.state.isConnected
      );
    },
    [collabContext]
  );

  const getCurrentRoomStatus = useCallback(() => {
    if (!collabContext) return null;

    return {
      isInRoom: collabContext.state.isCollaborating,
      roomId: collabContext.state.roomId,
      userId: collabContext.state.userId,
      isConnected: collabContext.state.isConnected,
      collaborators: collabContext.state.collaborators,
    };
  }, [collabContext]);

  return {
    checkRoomStatus,
    isUserInRoom,
    getCurrentRoomStatus,
    isChecking,
    lastStatus,
    error,
    hasValidParams: hasRoomParams,
  };
};
