import { be_url } from "@/env/e";
import { IsInARoom } from "@/helpers/collab.h";
import React, {
  useReducer,
  useEffect,
  useContext,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import type { Element } from "@/types";
import { useGeneral } from "./GeneralContext";

export interface PendingJoinRequest {
  id: string;
  name: string;
  color: string;
  roomId: string;
}

type CollaborativeOperation =
  | {
      type: "element_start";
      roomId?: string;
      elementId: string;
      authorId?: string;
      userId?: string;
      timestamp?: number;
      element?: Element;
      data?: {
        element?: Element;
        tool?: string;
      };
    }
  | {
      type: "element_create";
      roomId?: string;
      elementId?: string;
      authorId?: string;
      userId?: string;
      timestamp?: number;
      element?: Element;
      data?: {
        element?: Element;
      };
    }
  | {
      type: "element_update";
      roomId?: string;
      elementId: string;
      authorId?: string;
      userId?: string;
      timestamp?: number;
      data: Partial<Element>;
    }
  | {
      type: "element_complete";
      roomId?: string;
      elementId: string;
      authorId?: string;
      userId?: string;
      timestamp?: number;
      data: {
        element: Element;
      };
    }
  | {
      type: "element_delete";
      roomId?: string;
      elementId: string;
      authorId?: string;
      userId?: string;
      timestamp?: number;
      data?: Record<string, never>;
    };

interface CollabState {
  isConnected: boolean;
  isConnecting: boolean;
  isCollaborating: boolean;
  roomId: string | null;
  userId: string | null;
  pendingOperation: CollaborativeOperation | null;
  collaborators: Array<{
    id: string;
    name: string;
    color: string;
    cursor: { x: number; y: number };
  }>;
  socket: Socket | null;
  error: string | null;
  hostId: string | null;
  settings: { onlyHostCanDraw: boolean; requireApproval: boolean } | null;
  isWaitingForApproval: boolean;
  joinRejected: boolean;
  pendingJoinRequests: PendingJoinRequest[];
}

type CollabAction =
  | { type: "SOCKET_CONNECTING" }
  | { type: "SOCKET_CONNECTED"; payload: Socket }
  | { type: "SOCKET_DISCONNECTED" }
  | { type: "SOCKET_ERROR"; payload: string }
  | { type: "JOINING_ROOM"; payload: { roomId: string; userId: string } }
  | {
      type: "ROOM_JOINED";
      payload: {
        collaborators: Array<{
          id: string;
          name: string;
          color: string;
          cursor: { x: number; y: number };
        }>;
        elements?: Element[];
        hostId?: string;
        settings?: { onlyHostCanDraw: boolean; requireApproval: boolean };
      };
    }
  | { type: "WAITING_FOR_APPROVAL" }
  | { type: "JOIN_REJECTED" }
  | { type: "ADD_JOIN_REQUEST"; payload: PendingJoinRequest }
  | { type: "REMOVE_JOIN_REQUEST"; payload: string }
  | {
      type: "COLLABORATORS_UPDATED";
      payload: Array<{
        id: string;
        name: string;
        color: string;
        cursor: { x: number; y: number };
      }>;
    }
  | { type: "LOCAL_OPERATION_SENT"; payload: CollaborativeOperation }
  | {
      type: "CURSOR_UPDATED";
      payload: { userId: string; cursor: { x: number; y: number } };
    }
  | { type: "LEAVE_ROOM" }
  | { type: "CLEAR_ERROR" };

interface CollabContextType {
  state: CollabState;
  joinRoom: (
    roomId: string,
    userName: string,
    settings?: { onlyHostCanDraw: boolean; requireApproval: boolean },
  ) => void;
  resolveJoinRequest: (guestId: string, action: "accept" | "reject") => void;
  leaveRoom: () => void;
  sendOperation: (operation: CollaborativeOperation) => void;
  updateCursor: (cursor: { x: number; y: number }) => void;
  updateDrawingStatus: (isDrawing: boolean, elementId?: string) => void;
  clearError: () => void;
  isUserInCurrentRoom: (userId?: string) => boolean;
  checkRoomStatus: (roomId: string, userId: string) => Promise<boolean>;
  getCurrentRoomInfo: () => {
    roomId: string | null;
    userId: string | null;
    collaboratorsCount: number;
  };
  isJoinSidebarOpen: boolean;
  setIsJoinSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const initialState: CollabState = {
  isConnected: false,
  isConnecting: false,
  isCollaborating: false,
  roomId: null,
  userId: null,
  pendingOperation: null,
  collaborators: [],
  socket: null,
  error: null,
  hostId: null,
  settings: null,
  isWaitingForApproval: false,
  joinRejected: false,
  pendingJoinRequests: [],
};

const collabReducer = (
  state: CollabState,
  action: CollabAction,
): CollabState => {
  switch (action.type) {
    case "SOCKET_CONNECTING":
      return {
        ...state,
        isConnecting: true,
        error: null,
      };

    case "SOCKET_CONNECTED":
      return {
        ...state,
        isConnected: true,
        isConnecting: false,
        socket: action.payload,
        error: null,
      };

    case "SOCKET_DISCONNECTED":
      return {
        ...state,
        isConnected: false,
        isConnecting: false,
        isCollaborating: false,
        socket: null,
        roomId: null,
        userId: null,
        collaborators: [],
        error: null,
      };

    case "SOCKET_ERROR":
      return {
        ...state,
        isConnecting: false,
        error: action.payload,
      };

    case "JOINING_ROOM":
      return {
        ...state,
        roomId: action.payload.roomId,
        userId: action.payload.userId,
        error: null,
      };

    case "ROOM_JOINED":
      return {
        ...state,
        isCollaborating: true,
        collaborators: action.payload.collaborators,
        hostId: action.payload.hostId || null,
        settings: action.payload.settings || null,
        isWaitingForApproval: false,
        joinRejected: false,
        error: null,
      };

    case "WAITING_FOR_APPROVAL":
      return {
        ...state,
        isWaitingForApproval: true,
        joinRejected: false,
        error: null,
      };

    case "JOIN_REJECTED":
      return {
        ...state,
        isWaitingForApproval: false,
        joinRejected: true,
        error: null,
      };

    case "ADD_JOIN_REQUEST":
      return {
        ...state,
        pendingJoinRequests: [
          ...state.pendingJoinRequests.filter(
            (r) => r.id !== action.payload.id,
          ),
          action.payload,
        ],
      };

    case "REMOVE_JOIN_REQUEST":
      return {
        ...state,
        pendingJoinRequests: state.pendingJoinRequests.filter(
          (r) => r.id !== action.payload,
        ),
      };

    case "LOCAL_OPERATION_SENT":
      return {
        ...state,
        pendingOperation: action.payload,
      };

    case "COLLABORATORS_UPDATED":
      return {
        ...state,
        collaborators: action.payload,
      };

    case "CURSOR_UPDATED":
      return {
        ...state,
        collaborators: state.collaborators.map((collab) =>
          collab.id === action.payload.userId
            ? { ...collab, cursor: action.payload.cursor }
            : collab,
        ),
      };

    case "LEAVE_ROOM":
      return {
        ...state,
        isCollaborating: false,
        roomId: null,
        userId: null,
        collaborators: [],
        hostId: null,
        settings: null,
        isWaitingForApproval: false,
        joinRejected: false,
        pendingJoinRequests: [],
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

export const CollabContext = React.createContext<CollabContextType | null>(
  null,
);

export const CollabProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(collabReducer, initialState);
  const [isJoinSidebarOpen, setIsJoinSidebarOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { setCurrentStage } = useGeneral();

  const stateRef = useRef(state);
  const lastCursorUpdateRef = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(be_url, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        autoConnect: false,
      });
    }
  }, []);

  useEffect(() => {
    const isUserInsideRoom = Boolean(state.roomId && state.isCollaborating);
    setCurrentStage(isUserInsideRoom ? "cg" : "lobby");
  }, [state.roomId, state.isCollaborating, setCurrentStage]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) {
      return;
    }

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      dispatch({ type: "SOCKET_CONNECTED", payload: socket });

      // Auto-rejoin if we were already in a room
      if (stateRef.current.roomId && stateRef.current.userId) {
        console.log("Auto-rejoining room after connection restored...");
        // Re-emit join_room with the current stored userId so we don't duplicate
        const userName =
          sessionStorage.getItem(`draw_userName_${stateRef.current.roomId}`) ||
          "Anonymous";
        const userColor =
          sessionStorage.getItem(`draw_userColor_${stateRef.current.roomId}`) ||
          getRandomColor();

        socket.emit("join_room", {
          roomId: stateRef.current.roomId,
          user: {
            id: stateRef.current.userId,
            name: userName,
            color: userColor,
          },
        });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      dispatch({ type: "SOCKET_DISCONNECTED" });
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      dispatch({ type: "SOCKET_ERROR", payload: error.message });
    });

    // colaboration events
    socket.on("room_joined", (data) => {
      console.log("Joined room:", data);
      dispatch({
        type: "ROOM_JOINED",
        payload: {
          collaborators: data.collaborators || [],
          elements: data.elements || [],
          hostId: data.hostId,
          settings: data.settings,
        },
      });

      // Dispatch custom event for CanvasBoard to handle elements
      window.dispatchEvent(new CustomEvent("room_joined", { detail: data }));
    });

    socket.on("waiting_for_approval", () => {
      dispatch({ type: "WAITING_FOR_APPROVAL" });
    });

    socket.on("join_rejected", () => {
      dispatch({ type: "JOIN_REJECTED" });
    });

    socket.on(
      "join_request",
      ({
        roomId,
        guest,
      }: {
        roomId: string;
        guest: { id: string; name: string; color: string };
      }) => {
        dispatch({
          type: "ADD_JOIN_REQUEST",
          payload: {
            id: guest.id,
            name: guest.name,
            color: guest.color,
            roomId,
          },
        });
      },
    );

    socket.on("collaborators_updated", (collaborators) => {
      console.log("Collaborators updated:", collaborators);
      dispatch({ type: "COLLABORATORS_UPDATED", payload: collaborators });
    });

    socket.on("cursor_moved", ({ userId, position }) => {
      dispatch({
        type: "CURSOR_UPDATED",
        payload: { userId, cursor: position },
      });
    });

    socket.on("operation_applied", (data) => {
      // Dispatch custom event for drawing components to handle
      window.dispatchEvent(
        new CustomEvent("collab_operation", { detail: data }),
      );
    });

    // Handle laser tool events
    socket.on("laser_point", ({ userId, point, timestamp }) => {
      if (userId !== stateRef.current.userId) {
        window.dispatchEvent(
          new CustomEvent("collab_laser_point", {
            detail: { userId, point, timestamp },
          }),
        );
      }
    });

    socket.on("laser_clear", ({ userId }) => {
      if (userId !== stateRef.current.userId) {
        window.dispatchEvent(
          new CustomEvent("collab_laser_clear", {
            detail: { userId },
          }),
        );
      }
    });

    // Handle room left confirmation
    socket.on("room_left", ({ success, error }) => {
      console.log("Room left response:", { success, error });
      if (success) {
        dispatch({ type: "LEAVE_ROOM" });
        console.log("Successfully left room - state updated");
        // Dispatch custom event for components to handle
        window.dispatchEvent(new CustomEvent("room_left_success"));
        socket.disconnect();
      } else {
        console.error("Failed to leave room:", error);
        window.dispatchEvent(
          new CustomEvent("room_left_error", { detail: { error } }),
        );
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinRoom = (
    roomId: string,
    userName: string,
    settings?: { onlyHostCanDraw: boolean },
  ) => {
    const socket = socketRef.current;
    if (!socket) {
      console.error("Socket not initialized");
      return;
    }

    // Check session storage first for existing userId to maintain identity on refresh
    let userId = sessionStorage.getItem(`draw_userId_${roomId}`);
    let userColor = sessionStorage.getItem(`draw_userColor_${roomId}`);

    if (!userId) {
      userId = `user_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;
      sessionStorage.setItem(`draw_userId_${roomId}`, userId);
    }

    if (!userColor) {
      userColor = getRandomColor();
      sessionStorage.setItem(`draw_userColor_${roomId}`, userColor);
    }

    // Store username for auto-rejoin
    sessionStorage.setItem(`draw_userName_${roomId}`, userName);

    const performJoin = () => {
      // Avoid joining multiple times if already joined
      if (
        stateRef.current.isCollaborating &&
        stateRef.current.roomId === roomId &&
        stateRef.current.userId === userId
      ) {
        return;
      }
      dispatch({
        type: "JOINING_ROOM",
        payload: { roomId, userId: userId as string },
      });
      socket.emit("join_room", {
        roomId,
        user: {
          id: userId,
          name: userName || `Anonymous ${userId!.slice(-4)}`,
          color: userColor,
        },
        settings,
      });
    };

    if (!socket.connected) {
      dispatch({ type: "SOCKET_CONNECTING" });
      socket.connect();
      socket.once("connect", () => {
        performJoin();
      });
      return;
    }

    performJoin();
  };

  const resolveJoinRequest = (guestId: string, action: "accept" | "reject") => {
    if (state.socket && state.roomId) {
      state.socket.emit("handle_join_request", {
        roomId: state.roomId,
        guestId,
        action,
      });
      dispatch({ type: "REMOVE_JOIN_REQUEST", payload: guestId });
    }
  };

  const leaveRoom = () => {
    if (state.socket && state.roomId) {
      console.log("Emitting leave_room event for roomId:", state.roomId);
      state.socket.emit("leave_room", { roomId: state.roomId });
      // Don't dispatch LEAVE_ROOM here - wait for server confirmation via "room_left" event
    } else {
      console.error("Cannot leave room: missing socket or roomId", {
        hasSocket: !!state.socket,
        roomId: state.roomId,
      });
    }
  };

  const sendOperation = (operation: CollaborativeOperation) => {
    if (!state.socket || !state.roomId || !state.isCollaborating) {
      console.warn("Cannot send operation: not in collaboration mode", {
        hasSocket: !!state.socket,
        roomId: state.roomId,
        isCollaborating: state.isCollaborating,
      });
      return;
    }

    const enrichedOperation: CollaborativeOperation = {
      ...operation,
      authorId: operation.authorId ?? state.userId ?? undefined,
      timestamp: Date.now(),
    };

    console.log(
      "Sending operation:",
      enrichedOperation.type,
      enrichedOperation,
    );

    state.socket.emit("drawing_operation", {
      roomId: state.roomId,
      operation: {
        ...enrichedOperation,
        userId: state.userId ?? undefined,
      },
    });
  };

  const updateCursor = (cursor: { x: number; y: number }) => {
    if (!state.socket || !state.roomId || !state.isCollaborating) {
      return;
    }

    // Throttle cursor updates
    if (Date.now() - lastCursorUpdateRef.current < 50) {
      return;
    }
    lastCursorUpdateRef.current = Date.now();

    state.socket.emit("cursor_update", {
      roomId: state.roomId,
      position: cursor,
    });
  };

  const updateDrawingStatus = (isDrawing: boolean, elementId?: string) => {
    // This function can be used to track drawing status for collaborators
    // For now, it's a placeholder - you could emit socket events here if needed
    console.log("Drawing status updated:", { isDrawing, elementId });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const isUserInCurrentRoom = (userId?: string): boolean => {
    if (!state.isCollaborating || !state.roomId || !state.userId) {
      return false;
    }

    if (userId) {
      return state.userId === userId && state.isConnected;
    }

    return state.isConnected;
  };

  const checkRoomStatus = async (
    roomId: string,
    userId: string,
  ): Promise<boolean> => {
    if (!state.socket || !roomId || !userId) {
      return false;
    }

    try {
      const response = await IsInARoom({
        params: { roomId, userId },
        _Socket: state.socket,
      });
      return response.isInRoom;
    } catch (error) {
      console.error("Error checking room status:", error);
      return false;
    }
  };

  const getCurrentRoomInfo = () => {
    return {
      roomId: state.roomId,
      userId: state.userId,
      collaboratorsCount: state.collaborators.length,
    };
  };

  const contextValue: CollabContextType = {
    state,
    joinRoom,
    resolveJoinRequest,
    leaveRoom,
    sendOperation,
    updateCursor,
    updateDrawingStatus,
    clearError,
    isUserInCurrentRoom,
    checkRoomStatus,
    getCurrentRoomInfo,
    isJoinSidebarOpen,
    setIsJoinSidebarOpen,
  };

  return (
    <CollabContext.Provider value={contextValue}>
      {children}
    </CollabContext.Provider>
  );
};

// Custom hook with error handling
export const useCollab = () => {
  const context = useContext(CollabContext);
  if (!context) {
    throw new Error("useCollab must be used within a CollabProvider");
  }
  return context;
};

const getRandomColor = () => {
  const colors = [
    "#ff6b6b", // red
    "#4ecdc4", // teal
    "#45b7d1", // blue
    "#96ceb4", // green
    "#feca57", // yellow-orange
    "#ff9ff3", // pink
    "#54a0ff", // light blue
    "#5f27cd", // purple
    "#01a3a4", // dark teal
    "#2ecc71", // emerald green
    "#e74c3c", // bright red
    "#f39c12", // orange
    "#8e44ad", // violet
    "#d35400", // pumpkin
    "#1abc9c", // turquoise
    "#3498db", // sky blue
    "#9b59b6", // lavender purple
    "#34495e", // dark slate
    "#16a085", // sea green
    "#27ae60", // jade green
    "#2980b9", // ocean blue
    "#c0392b", // crimson
    "#f1c40f", // sunflower yellow
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
