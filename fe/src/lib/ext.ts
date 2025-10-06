import type { Socket } from "socket.io-client";

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

    // Set up the response listener
    const handleResponse = (response: RoomStatusResponse) => {
      _Socket.off("room-status-response", handleResponse);
      resolve(response);
    };

    // Set up error timeout
    const timeout = setTimeout(() => {
      _Socket.off("room-status-response", handleResponse);
      reject(new Error("Room status check timeout"));
    }, 5000); // 5 second timeout

    _Socket.on("room-status-response", (response: RoomStatusResponse) => {
      clearTimeout(timeout);
      handleResponse(response);
    });

    // Emit the check request
    _Socket.emit("check-if-in-room", {
      roomId,
      userId,
    });
  });
};

// Synchronous version that only checks if parameters are valid
export const hasRoomParams = (roomId: string, userId: string): boolean => {
  return !!(roomId && userId && roomId.trim() !== "" && userId.trim() !== "");
};
