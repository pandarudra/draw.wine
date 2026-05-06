export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  socketId: string;
  isDrawing?: boolean;
  currentElementId?: string;
  joinedAt: number;
}

export interface Room {
  id: string;
  users: Map<string, User>;
  elements: Element[];
  lastActivity: number;
  createdAt: number;
  hostId?: string;
  settings?: {
    onlyHostCanDraw: boolean;
  };
}

export interface Element {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  roughness?: number;
  seed?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  points?: Array<{ x: number; y: number }>;
  imageUrl?: string;
  aspectRatio?: number;
  authorId?: string;
  isTemporary?: boolean;
}

export interface DrawingOperation {
  type:
    | "element_start"
    | "element_update"
    | "element_complete"
    | "element_delete";
  roomId: string;
  elementId: string;
  authorId: string;
  data: any;
  timestamp?: number;
}
