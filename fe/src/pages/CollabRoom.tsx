import { PlayGround } from "./PlayGround";
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
import { useCollabRoom } from "@/hooks/useCollabRoom";

const CollabRoom = () => {
  const {
    roomId,
    userName,
    setUserName,
    isModalOpen,
    setIsModalOpen,
    handleJoin,
    state,
  } = useCollabRoom();

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
    if (state.joinRejected) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center">
          <div className="text-center max-w-md p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Join Request Declined</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The host of this room has declined your request to join.
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Return Home
            </Button>
          </div>
        </div>
      );
    }

    if (state.isWaitingForApproval) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center">
          <div className="text-center max-w-md p-6">
            <div className="animate-pulse rounded-full h-16 w-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Asking to join...</h2>
            <p className="text-gray-600 dark:text-gray-400">
              You'll join the room when the host lets you in.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen w-full flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse rounded-full h-8 w-8 border-2 border-green-500 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Joining room: {roomId}...</p>
        </div>
      </div>
    );
  }

  return <PlayGround />;
};

export default CollabRoom;
