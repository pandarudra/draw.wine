import type { Collaborator, Position } from "@/types";

// Cursor
export const CollabCursor = ({
  collaborator,
  position,
  scale,
}: {
  collaborator: Collaborator;
  position: Position;
  scale: number;
}) => (
  <div
    className="absolute pointer-events-none z-50 -translate-x-0.5 -translate-y-0.5"
    style={{
      left: `${collaborator.cursor.x * scale + position.x}px`,
      top: `${collaborator.cursor.y * scale + position.y}px`,
    }}
  >
    <div className="relative">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="drop-shadow-sm"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={collaborator.color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>

      <div
        className="absolute top-6 left-2 px-2 py-1 rounded text-white text-xs whitespace-nowrap shadow-lg collab-cursor-label"
        style={{ "--collab-color": collaborator.color } as React.CSSProperties}
      >
        {collaborator.name}
        {collaborator.isDrawing && (
          <span className="ml-1 animate-pulse">✏️</span>
        )}
      </div>
    </div>
  </div>
);
