import { useCollab } from "@/contexts/CollabContext";
import { LuUsers, LuCheck, LuX } from "react-icons/lu";

export const JoinRequestsSidebar = () => {
  const { state, resolveJoinRequest, isJoinSidebarOpen, setIsJoinSidebarOpen } = useCollab();

  const isHost = state.userId === state.hostId;
  const hasRequests = state.pendingJoinRequests.length > 0;

  // Only show the button if the user is the host and the room requires approval
  if (!isHost || !state.isCollaborating || !state.settings?.requireApproval) {
    return null;
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsJoinSidebarOpen((prev) => !prev)}
        className="relative p-2.5 rounded-lg border bg-background/80 backdrop-blur-sm shadow-sm hover:bg-accent transition-colors"
        title="Join Requests"
      >
        <LuUsers className="w-4 h-4" />
        {hasRequests && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-background animate-pulse" />
        )}
      </button>

      {/* Sidebar panel */}
      {isJoinSidebarOpen && (
        <div className="fixed top-0 right-0  h-full w-80 z-100 flex flex-col bg-background/95 backdrop-blur-md border-l shadow-2xl animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <LuUsers className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Join Requests</h3>
              {hasRequests && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 rounded-full">
                  {state.pendingJoinRequests.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsJoinSidebarOpen(false)}
              className="p-1 rounded hover:bg-accent transition-colors"
            >
              <LuX className="w-4 h-4" />
            </button>
          </div>

          {/* Request list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {state.pendingJoinRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <LuUsers className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No pending requests</p>
                <p className="text-xs mt-1 opacity-70">
                  New join requests will appear here
                </p>
              </div>
            ) : (
              state.pendingJoinRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: request.color }}
                    >
                      {request.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate">
                      {request.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={() => resolveJoinRequest(request.id, "accept")}
                      className="p-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400 dark:hover:bg-green-900/60 transition-colors"
                      title="Accept"
                    >
                      <LuCheck className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => resolveJoinRequest(request.id, "reject")}
                      className="p-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60 transition-colors"
                      title="Decline"
                    >
                      <LuX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};
