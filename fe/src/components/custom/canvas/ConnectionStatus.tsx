import type { Collaborator } from "@/types";

// Connection Status Component
export const ConnectionStatus = ({
  isConnected,
  collaborators,
  visible = true,
}: {
  isConnected: boolean;
  collaborators: Collaborator[];
  visible?: boolean;
}) => (
  <div
    className={`absolute top-16 right-4 z-50 bg-background rounded-lg shadow-lg p-3 max-w-xs border ${
      visible ? "block" : "hidden"
    }`}
  >
    <div className="flex items-center space-x-2 mb-2 ">
      <div
        className={`w-3 h-3 rounded-full flex flex-col ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span className="text-sm font-medium">
        {isConnected ? "Connected" : "Disconnected"}
      </span>
    </div>

    {collaborators.length > 0 && (
      <div>
        <h4 className="text-sm font-semibold mb-2">
          Active Users ({collaborators.length})
        </h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {collaborators.map((collaborator) => (
            <div key={collaborator.id} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full collab-user-dot"
                style={
                  {
                    "--collab-color": collaborator.color,
                  } as React.CSSProperties
                }
              />
              <span className="text-sm truncate">{collaborator.name}</span>
              {collaborator.isDrawing && (
                <span className="text-xs text-gray-500">drawing...</span>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);
