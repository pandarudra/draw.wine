import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PlayGround } from "./PlayGround";
import { useCollab } from "@/contexts/CollabContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { v4 } from "uuid";

const CollabRoom = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const roomId = searchParams.get("room") || generateRoomId();
  const initialUserName = searchParams.get("name") || "";
  const { state, joinRoom } = useCollab();

  const [userName, setUserName] = useState(initialUserName);
  const [isModalOpen, setIsModalOpen] = useState(!initialUserName);

  useEffect(() => {
    if (roomId && state.isConnected && !state.isCollaborating && userName) {
      console.log("Joining room:", roomId, "with name:", userName);
      joinRoom(roomId, userName);
    }
  }, [roomId, state.isConnected, state.isCollaborating, joinRoom, isModalOpen]);

  // Handle modal submission
  const handleJoin = () => {
    if (userName.trim()) {
      setSearchParams({ room: roomId, name: userName });
      setIsModalOpen(false);
    }
  };

  // Show modal for username if missing
  if (isModalOpen) {
    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter your name</DialogTitle>
            <DialogDescription>
              This will be visible to other collaborators in the room.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user-name" className="text-right">
                Your Name
              </Label>
              <Input
                id="user-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Anonymous"
                autoFocus
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleJoin} disabled={!userName.trim()}>
              Join Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Show loading state while connecting
  if (!state.isConnected) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            Connecting to collaboration server...
          </p>
          {state.error && (
            <p className="mt-2 text-red-500 text-sm">Error: {state.error}</p>
          )}
        </div>
      </div>
    );
  }

  // Show joining state
  if (state.isConnected && !state.isCollaborating) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse rounded-full h-8 w-8 border-2 border-green-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Joining room: {roomId}...</p>
        </div>
      </div>
    );
  }

  return <PlayGround />;
};

function generateRoomId(): string {
  return v4().slice(0, 8);
}

export default CollabRoom;
