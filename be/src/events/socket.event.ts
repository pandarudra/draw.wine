import { Server as SocketServer, Socket } from "socket.io";
import type { User, Room, DrawingOperation } from "../types";

const rooms = new Map<string, Room>();

// Cleanup inactive rooms every hour
setInterval(() => {
  const now = Date.now();
  const ROOM_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  for (const [roomId, room] of rooms) {
    if (now - room.lastActivity > ROOM_TIMEOUT || room.users.size === 0) {
      rooms.delete(roomId);
      console.log(`Cleaned up inactive room: ${roomId}`);
    }
  }
}, 60 * 60 * 1000);

export const ExecSocketEvents = (io: SocketServer) => {
  io.on("connection", (socket: Socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on(
      "join_room",
      ({
        roomId,
        user,
      }: {
        roomId: string;
        user: Omit<User, "socketId" | "joinedAt">;
      }) => {
        try {
          console.log(`User ${user.name} joining room ${roomId}`);

          socket.join(roomId);

          // Create room if doesn't exist
          if (!rooms.has(roomId)) {
            rooms.set(roomId, {
              id: roomId,
              users: new Map(),
              elements: [],
              lastActivity: Date.now(),
              createdAt: Date.now(),
            });
          }

          const room = rooms.get(roomId)!;

          // Remove any existing user with the same ID (in case of reconnection)
          for (const [existingUserId, existingUser] of room.users) {
            if (
              existingUser.socketId === socket.id ||
              existingUserId === user.id
            ) {
              room.users.delete(existingUserId);
              console.log(
                `Removed existing user ${existingUserId} from room ${roomId}`
              );
            }
          }

          // Add user to room
          const fullUser: User = {
            ...user,
            socketId: socket.id,
            joinedAt: Date.now(),
            color: user.color || getRandomColor(),
          };

          room.users.set(user.id, fullUser);
          room.lastActivity = Date.now();

          // Send current room state to new user
          socket.emit("room_joined", {
            roomId,
            elements: room.elements,
            collaborators: Array.from(room.users.values()).map((u) => ({
              id: u.id,
              name: u.name,
              color: u.color,
              cursor: u.cursor,
              isDrawing: u.isDrawing,
            })),
          });

          // Notify other users about new collaborator
          socket.to(roomId).emit(
            "collaborators_updated",
            Array.from(room.users.values()).map((u) => ({
              id: u.id,
              name: u.name,
              color: u.color,
              cursor: u.cursor,
              isDrawing: u.isDrawing,
            }))
          );

          console.log(`Room ${roomId} now has ${room.users.size} users`);
        } catch (error) {
          console.error("Error joining room:", error);
          socket.emit("error", { message: "Failed to join room" });
        }
      }
    );

    socket.on("drawing_operation", (data: any) => {
      try {
        console.log("=== BACKEND: Received drawing operation ===");
        console.log("Full data received:", JSON.stringify(data, null, 2));

        // Extract the actual operation from the data
        const operation = data.operation;
        const roomId = data.roomId;

        if (!operation || !operation.type) {
          console.error("Invalid operation structure received:", data);
          return;
        }

        console.log("Operation type:", operation.type);
        console.log("Element ID:", operation.elementId);
        console.log("Author ID:", operation.authorId);
        console.log("Room ID:", roomId);
        console.log("Operation data:", JSON.stringify(operation.data, null, 2));

        const room = rooms.get(roomId);
        if (!room) {
          console.error(`Room ${roomId} not found`);
          return;
        }

        console.log(
          `Room ${roomId} has ${room.elements.length} elements before operation`
        );

        // Update room state based on operation
        switch (operation.type) {
          case "element_start":
            // Add new element as temporary
            if (operation.data.element) {
              room.elements.push({
                ...operation.data.element,
                isTemporary: true,
              });
            }
            break;

          case "element_update":
            // Update element properties
            const updateIndex = room.elements.findIndex(
              (el) => el.id === operation.elementId
            );
            if (updateIndex !== -1) {
              room.elements[updateIndex] = {
                ...room.elements[updateIndex],
                ...operation.data,
              };
            }
            break;

          case "element_complete":
            // Mark element as completed
            const completeIndex = room.elements.findIndex(
              (el) => el.id === operation.elementId
            );
            if (completeIndex !== -1) {
              room.elements[completeIndex] = {
                ...room.elements[completeIndex],
                ...operation.data.element,
                isTemporary: false,
              };
            }
            break;

          case "element_delete":
            // Remove element
            room.elements = room.elements.filter(
              (el) => el.id !== operation.elementId
            );
            break;
        }

        room.lastActivity = Date.now();

        console.log(
          `Room ${roomId} now has ${room.elements.length} elements after operation`
        );

        console.log("=== BACKEND: Broadcasting operation to room ===");
        console.log("Broadcasting to room:", roomId);
        console.log(
          "Operation being broadcast:",
          JSON.stringify(operation, null, 2)
        );

        // Broadcast operation to other users in room
        socket.to(roomId).emit("operation_applied", operation);

        // Update user's drawing status
        const user = room.users.get(operation.authorId);
        if (user) {
          user.isDrawing = operation.type === "element_start";
          user.currentElementId =
            operation.type === "element_start"
              ? operation.elementId
              : undefined;
        }
      } catch (error) {
        console.error("Error processing drawing operation:", error);
      }
    });

    socket.on(
      "cursor_update",
      ({
        roomId,
        position,
      }: {
        roomId: string;
        position: { x: number; y: number };
      }) => {
        try {
          const room = rooms.get(roomId);
          if (!room) return;

          // Find user and update cursor
          for (const [userId, user] of room.users) {
            if (user.socketId === socket.id) {
              user.cursor = position;
              break;
            }
          }

          // Broadcast cursor update to other users
          socket.to(roomId).emit("cursor_moved", {
            userId: Array.from(room.users.values()).find(
              (u) => u.socketId === socket.id
            )?.id,
            position,
          });
        } catch (error) {
          console.error("Error updating cursor:", error);
        }
      }
    );

    // Handle laser tool events
    socket.on(
      "laser_point",
      ({
        roomId,
        point,
        userId,
        timestamp,
      }: {
        roomId: string;
        point: { x: number; y: number };
        userId: string;
        timestamp: number;
      }) => {
        try {
          const room = rooms.get(roomId);
          if (!room) return;

          // Broadcast laser point to other users in room
          socket.to(roomId).emit("laser_point", {
            userId,
            point,
            timestamp,
          });
        } catch (error) {
          console.error("Error broadcasting laser point:", error);
        }
      }
    );

    socket.on(
      "laser_clear",
      ({ roomId, userId }: { roomId: string; userId: string }) => {
        try {
          const room = rooms.get(roomId);
          if (!room) return;

          // Broadcast laser clear to other users in room
          socket.to(roomId).emit("laser_clear", {
            userId,
          });
        } catch (error) {
          console.error("Error broadcasting laser clear:", error);
        }
      }
    );

    socket.on(
      "check-if-in-room",
      ({ roomId, userId }: { roomId: string; userId: string }) => {
        try {
          const room = rooms.get(roomId);
          let isInRoom = false;
          let userInfo = null;

          if (room) {
            const user = room.users.get(userId);
            if (user && user.socketId === socket.id) {
              isInRoom = true;
              userInfo = {
                id: user.id,
                name: user.name,
                color: user.color,
                joinedAt: user.joinedAt,
              };
            }
          }

          socket.emit("room-status-response", {
            roomId,
            userId,
            isInRoom,
            userInfo,
            roomExists: !!room,
            collaboratorsCount: room?.users.size || 0,
          });

          console.log(
            `Room status check for user ${userId} in room ${roomId}: ${isInRoom}`
          );
        } catch (error) {
          console.error("Error checking room status:", error);
          socket.emit("room-status-response", {
            roomId,
            userId,
            isInRoom: false,
            userInfo: null,
            roomExists: false,
            collaboratorsCount: 0,
            error: "Failed to check room status",
          });
        }
      }
    );

    socket.on("leave_room", ({ roomId }: { roomId: string }) => {
      try {
        const room = rooms.get(roomId);
        if (!room) return;

        // Remove user from room
        for (const [userId, user] of room.users) {
          if (user.socketId === socket.id) {
            room.users.delete(userId);
            socket.leave(roomId);

            // Notify other users
            socket.to(roomId).emit(
              "collaborators_updated",
              Array.from(room.users.values()).map((u) => ({
                id: u.id,
                name: u.name,
                color: u.color,
                cursor: u.cursor,
                isDrawing: u.isDrawing,
              }))
            );

            // Send confirmation to the leaving user
            socket.emit("room_left", { roomId, success: true });

            console.log(`User ${user.name} left room ${roomId}`);
            break;
          }
        }
      } catch (error) {
        console.error("Error leaving room:", error);
        socket.emit("room_left", {
          roomId,
          success: false,
          error: "Failed to leave room",
        });
      }
    });

    socket.on("disconnect", () => {
      try {
        console.log(`Client disconnected: ${socket.id}`);

        // Remove user from all rooms
        for (const [roomId, room] of rooms) {
          for (const [userId, user] of room.users) {
            if (user.socketId === socket.id) {
              room.users.delete(userId);

              // Notify other users in the room
              socket.to(roomId).emit(
                "collaborators_updated",
                Array.from(room.users.values()).map((u) => ({
                  id: u.id,
                  name: u.name,
                  color: u.color,
                  cursor: u.cursor,
                  isDrawing: u.isDrawing,
                }))
              );

              console.log(`Removed disconnected user from room ${roomId}`);
              break;
            }
          }
        }
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });
  });
};

function getRandomColor(): string {
  const colors = [
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#96ceb4",
    "#feca57",
    "#ff9ff3",
    "#a8e6cf",
    "#ffd93d",
    "#6c5ce7",
    "#fd79a8",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
