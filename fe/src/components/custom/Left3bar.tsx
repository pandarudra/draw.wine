import { Button } from "../ui/button";
import { RxHamburgerMenu } from "react-icons/rx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MdSaveAlt, MdOutlineImage, MdOutlineFileUpload } from "react-icons/md";
import { RiResetLeftFill } from "react-icons/ri";
import { useState, useCallback } from "react";
import { CreateRoomModal } from "./modals/CreateRoomModal";
import { JoinRoomModal } from "./modals/JoinRoomModal";
import { ExportModal } from "./modals/ExportModal";
import { EmailInviteModal } from "./modals/EmailInviteModal";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { STORAGE_KEY } from "@/constants/canvas";
import {
  exportCanvasAsImage,
  saveCanvasAsJSON,
  loadCanvasFromJSON,
  type ExportOptions,
} from "@/utils/export";
import {
  getCanvasElement,
  getCanvasElements,
  getCanvasViewport,
  setCanvasElements,
} from "@/utils/canvasState";
import { useCollab } from "@/contexts/CollabContext";
import { toast } from "sonner";

export const Left3bar = () => {
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showEmailInvite, setShowEmailInvite] = useState(false);

  // Get collaboration context for room information
  const { state, isUserInCurrentRoom, leaveRoom } = useCollab();

  // Check if user is in a room to enable/disable invite functionality
  const isInRoom =
    state.isCollaborating && state.roomId && isUserInCurrentRoom();

  const gotoGithub = () => {
    const url = "https://github.com/pandarudra/draw.wine";
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleTeamClick = () => {
    setShowCreateRoom(true);
  };

  const handleJoinRoomClick = () => {
    setShowJoinRoom(true);
  };

  const handleEmailInviteClick = () => {
    if (!isInRoom) {
      toast.error("You need to be in a room to invite users");
      return;
    }
    setShowEmailInvite(true);
  };

  const handleLeaveRoomClick = () => {
    console.log("Leaving room:", state.roomId);
    console.log("Current state:", {
      isCollaborating: state.isCollaborating,
      roomId: state.roomId,
      hasSocket: !!state.socket,
    });

    if (!state.socket || !state.roomId) {
      toast.error("Cannot leave room: not properly connected");
      return;
    }

    // Set up event listeners for room leave responses
    const handleSuccess = () => {
      toast.success("Left the room successfully");
      window.removeEventListener("room_left_success", handleSuccess);
      window.removeEventListener(
        "room_left_error",
        handleError as EventListener
      );
    };

    const handleError = (event: Event) => {
      const customEvent = event as CustomEvent;
      toast.error(
        "Failed to leave room: " +
          (customEvent.detail?.error || "Unknown error")
      );
      window.removeEventListener("room_left_success", handleSuccess);
      window.removeEventListener(
        "room_left_error",
        handleError as EventListener
      );
    };

    window.addEventListener("room_left_success", handleSuccess);
    window.addEventListener("room_left_error", handleError as EventListener);

    try {
      leaveRoom();
      toast.info("Leaving room...");
      console.log("Leave room called successfully");
    } catch (error) {
      console.error("Error leaving room:", error);
      toast.error("Failed to leave room");
      // Clean up event listeners
      window.removeEventListener("room_left_success", handleSuccess);
      window.removeEventListener(
        "room_left_error",
        handleError as EventListener
      );
    }

    window.location.href = "/";
  };

  const handleCanvasReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  const onExportImg = useCallback(() => {
    setShowExportModal(true);
  }, []);

  const handleExport = useCallback((options: ExportOptions) => {
    const canvas = getCanvasElement();
    if (!canvas) {
      toast.error("Canvas not available for export");
      return;
    }

    try {
      const elements = getCanvasElements();
      const viewport = getCanvasViewport();

      exportCanvasAsImage(
        { current: canvas },
        elements,
        viewport.position,
        viewport.scale,
        options
      );
      toast.success(`Drawing exported as ${options.format.toUpperCase()}`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export drawing");
    }
  }, []);

  const onSave = useCallback(() => {
    try {
      const elements = getCanvasElements();
      saveCanvasAsJSON(elements);
      toast.success("Drawing saved successfully");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save drawing");
    }
  }, []);

  const onImport = useCallback(async () => {
    try {
      const importedElements = await loadCanvasFromJSON();
      setCanvasElements(importedElements);
      // Trigger a re-render by dispatching a custom event
      window.dispatchEvent(new CustomEvent("canvas-elements-updated"));
      toast.success(`Loaded ${importedElements.length} elements`);
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Failed to import drawing");
    }
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave,
    onExport: onExportImg,
    onImport,
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <RxHamburgerMenu />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={onSave}>
              <MdSaveAlt className="mr-2" />
              Save to...
              <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onImport}>
              <MdOutlineFileUpload className="mr-2" />
              Load from...
              <DropdownMenuShortcut>Ctrl+O</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportImg}>
              <MdOutlineImage className="mr-2" />
              Export image...
              <DropdownMenuShortcut>Ctrl+Shift+E</DropdownMenuShortcut>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleCanvasReset}>
              <RiResetLeftFill className="mr-2" />
              Reset the canvas
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {/* Room Status Indicator */}
            {isInRoom ? (
              <DropdownMenuItem disabled className="text-green-900 font-medium">
                ✓ In Room {state.roomId}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled className="text-gray-500">
                ○ Not in a room
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />

            {!isInRoom && (
              <>
                <DropdownMenuItem onClick={handleTeamClick}>
                  Create Room
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleJoinRoomClick}>
                  Join Room
                </DropdownMenuItem>
              </>
            )}
            {isInRoom && (
              <DropdownMenuItem
                onClick={handleLeaveRoomClick}
                className="text-red-600"
              >
                Leave Room
              </DropdownMenuItem>
            )}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                disabled={!isInRoom}
                className={!isInRoom ? "opacity-50" : ""}
              >
                Invite Users
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={handleEmailInviteClick}
                    disabled={!isInRoom}
                  >
                    Email
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={true}>
                    Message (Coming soon...)
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={gotoGithub}>GitHub</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateRoomModal
        isOpen={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
      />

      <JoinRoomModal
        isOpen={showJoinRoom}
        onClose={() => setShowJoinRoom(false)}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
      />
      <EmailInviteModal
        isOpen={showEmailInvite}
        onClose={() => setShowEmailInvite(false)}
        roomId={state.roomId || undefined}
        roomName={state.roomId ? `Room ${state.roomId}` : undefined}
      />
    </>
  );
};
