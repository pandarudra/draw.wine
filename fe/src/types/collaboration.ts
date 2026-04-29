import type { Socket } from "socket.io-client";
import type { Element } from "./element";

// --- Operation types used across collaboration ---

/** The full operation type used by CollabContext when sending/receiving via socket */
export type CollaborativeOperation =
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

/**
 * The operation payload as received by CanvasBoard from the collab_operation
 * CustomEvent. Mirrors CollaborativeOperation but is the shape after the
 * backend broadcasts it back (includes authorId on every variant).
 */
export type CollaborativeOperationPayload =
  | {
      type: "element_create" | "element_start";
      authorId?: string;
      element?: Element;
      data?: { element?: Element };
    }
  | {
      type: "element_update";
      authorId?: string;
      elementId: string;
      data: Partial<Element>;
    }
  | {
      type: "element_complete";
      authorId?: string;
      elementId: string;
      data?: { element?: Element };
    }
  | {
      type: "element_delete";
      authorId?: string;
      elementId: string;
    };

// --- Collaborator ---

export type Collaborator = {
  id: string;
  name: string;
  color: string;
  cursor: { x: number; y: number };
  isDrawing?: boolean;
};

// --- Collab state & actions (used by the reducer in CollabContext) ---

export interface CollabState {
  isConnected: boolean;
  isConnecting: boolean;
  isCollaborating: boolean;
  roomId: string | null;
  userId: string | null;
  pendingOperation: CollaborativeOperation | null;
  collaborators: Collaborator[];
  socket: Socket | null;
  error: string | null;
}

export type CollabAction =
  | { type: "SOCKET_CONNECTING" }
  | { type: "SOCKET_CONNECTED"; payload: Socket }
  | { type: "SOCKET_DISCONNECTED" }
  | { type: "SOCKET_ERROR"; payload: string }
  | { type: "JOINING_ROOM"; payload: { roomId: string; userId: string } }
  | {
      type: "ROOM_JOINED";
      payload: {
        collaborators: Collaborator[];
        elements?: Element[];
      };
    }
  | {
      type: "COLLABORATORS_UPDATED";
      payload: Collaborator[];
    }
  | { type: "LOCAL_OPERATION_SENT"; payload: CollaborativeOperation }
  | {
      type: "CURSOR_UPDATED";
      payload: { userId: string; cursor: { x: number; y: number } };
    }
  | { type: "LEAVE_ROOM" }
  | { type: "CLEAR_ERROR" };

export interface CollabContextType {
  state: CollabState;
  joinRoom: (roomId: string, userName: string) => void;
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
}
