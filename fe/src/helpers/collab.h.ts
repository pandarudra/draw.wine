import { v4 } from "uuid";
import type { Socket } from "socket.io-client";

export function generateRoomId(): string {
  return v4().slice(0, 8);
}

export interface RoomStatusResponse {
  roomId: string;
  userId: string;
  isInRoom: boolean;
  userInfo: {
    id: string;
    name: string;
    color: string;
    joinedAt: number;
  } | null;
  roomExists: boolean;
  collaboratorsCount: number;
  error?: string;
}

export const IsInARoom = ({
  params,
  _Socket,
}: {
  params: { roomId: string; userId: string };
  _Socket: Socket | null;
}): Promise<RoomStatusResponse> => {
  const { roomId, userId } = params;

  return new Promise((resolve, reject) => {
    if (!_Socket || !roomId || !userId) {
      reject(new Error("Missing required parameters or socket connection"));
      return;
    }

    const handleResponse = (response: RoomStatusResponse) => {
      _Socket.off("room-status-response", handleResponse);
      resolve(response);
    };

    const timeout = setTimeout(() => {
      _Socket.off("room-status-response", handleResponse);
      reject(new Error("Room status check timeout"));
    }, 5000);

    _Socket.on("room-status-response", (response: RoomStatusResponse) => {
      clearTimeout(timeout);
      handleResponse(response);
    });

    _Socket.emit("check-if-in-room", {
      roomId,
      userId,
    });
  });
};

export const hasRoomParams = (roomId: string, userId: string): boolean => {
  return !!(roomId && userId && roomId.trim() !== "" && userId.trim() !== "");
};
