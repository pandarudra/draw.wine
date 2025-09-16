export interface Position {
  x: number;
  y: number;
}

export interface Element {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: Position[];
  strokeColor: string;
  strokeWidth: number;
  roughness?: number;
  seed?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  authorId?: string;
  isTemporary?: boolean;
  imageUrl?: string; // URL or base64 string for the image
  aspectRatio?: number; // To maintain image proportions while resizing
}

export interface User {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  isPublic: boolean;
  inviteLink?: string;
}

export interface CollaborationState {
  isCollaborating: boolean;
  currentRoom: Room | null;
  currentUser: User | null;
  collaborators: User[];
  isCreator?: boolean;
}