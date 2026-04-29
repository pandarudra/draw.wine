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
