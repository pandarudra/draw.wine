import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useDrawing } from "@/contexts/DrawingContext";

import rough from "roughjs";
import type { Position, Element } from "@/types";
import { useLaserTrail } from "./LaserTrail";
import { eraseElements, getResizeHandles } from "@/utils/canvas";
import { ImageLoader } from "@/utils/imageLoader";
import { isElementInViewport } from "@/utils/viewport";
import {
  loadFromLocalStorage,
  saveToLocalStorage,
} from "@/utils/StoreProgress";
import { AUTO_SAVE_INTERVAL, ERASER_RADIUS } from "@/constants/canvas";
import { useCollab } from "@/contexts/CollabContext";

// Cursor
const CollabCursor = ({
  collaborator,
  position,
  scale,
}: {
  collaborator: any;
  position: Position;
  scale: number;
}) => (
  <div
    className="absolute pointer-events-none z-50"
    style={{
      left: `${collaborator.cursor.x * scale + position.x}px`,
      top: `${collaborator.cursor.y * scale + position.y}px`,
      transform: "translate(-2px, -2px)",
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
        className="absolute top-6 left-2 px-2 py-1 rounded text-white text-xs whitespace-nowrap shadow-lg"
        style={{ backgroundColor: collaborator.color }}
      >
        {collaborator.name}
        {collaborator.isDrawing && (
          <span className="ml-1 animate-pulse">✏️</span>
        )}
      </div>
    </div>
  </div>
);

// Connection Status Component
const ConnectionStatus = ({
  isConnected,
  collaborators,
}: {
  isConnected: boolean;
  collaborators: any[];
}) => (
  <div className="absolute top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-3 max-w-xs">
    <div className="flex items-center space-x-2 mb-2">
      <div
        className={`w-3 h-3 rounded-full ${
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
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: collaborator.color }}
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

export const CanvasBoard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrame = useRef<number | null>(null);
  const { selectedTool, strokeColor, strokeWidth, setSelectedTool } =
    useDrawing();

  // Get collaboration state
  const { state, sendOperation, updateCursor, updateDrawingStatus } =
    useCollab();

  // Local state for non-collaborative mode
  const [localElements, setLocalElements] = useState<Element[]>([]);
  const [collaborativeElements, setCollaborativeElements] = useState<Element[]>(
    []
  );

  // Debug collaborative elements
  useEffect(() => {
    console.log("=== FRONTEND: Collaborative elements updated ===");
    console.log("Count:", collaborativeElements.length);
    console.log(
      "Elements:",
      collaborativeElements.map((el) => ({
        id: el.id,
        type: el.type,
        isTemporary: el.isTemporary,
      }))
    );
  }, [collaborativeElements]);
  const [drawing, setDrawing] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState<Position>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [currentElement, setCurrentElement] = useState<Element | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [resizing, setResizing] = useState<{
    corner: string;
    elementId: string;
  } | null>(null);
  const [resizeStart, setResizeStart] = useState<Position | null>(null);
  const [eraserPos, setEraserPos] = useState<Position | null>(null);
  const [selectionArea, setSelectionArea] = useState<{
    start: Position;
    end: Position;
  } | null>(null);
  const [selectedElements, setSelectedElements] = useState<Element[]>([]);
  const laser = useLaserTrail();

  // Determine if we're in collaboration mode
  const isCollaborating = state.isCollaborating;
  const collaborators = state.collaborators;
  const isConnected = state.isConnected;

  // Use collaborative or local elements based on mode
  const elements = useMemo(
    () =>
      isCollaborating
        ? [...localElements, ...collaborativeElements]
        : localElements,
    [isCollaborating, localElements, collaborativeElements]
  );

  const setElements = isCollaborating
    ? setCollaborativeElements
    : setLocalElements;

  // Store collaborative laser trails from other users
  const [collaborativeLaserTrails, setCollaborativeLaserTrails] = useState<
    Map<
      string,
      Array<{
        point: { x: number; y: number };
        opacity: number;
        timestamp: number;
        color: string;
      }>
    >
  >(new Map());

  // Debug logging for elements
  useEffect(() => {
    if (isCollaborating) {
      console.log("=== CANVAS ELEMENTS DEBUG ===");
      console.log("Local elements count:", localElements.length);
      console.log(
        "Collaborative elements count:",
        collaborativeElements.length
      );
      console.log("Total elements count:", elements.length);
      console.log("Collaborative elements:", collaborativeElements);
    }
  }, [
    isCollaborating,
    localElements.length,
    collaborativeElements.length,
    collaborativeElements,
    elements.length,
  ]);

  // Listen for collaborative operations
  useEffect(() => {
    const handleCollabOperation = (event: CustomEvent) => {
      const operation = event.detail; // Operation should now be directly here
      console.log("CanvasBoard: Received collaborative operation", operation);

      if (!operation || !operation.type) {
        console.error("Invalid operation structure:", operation);
        return;
      }

      // Only process operations from other users
      if (operation.authorId === state.userId) {
        console.log("Ignoring operation from self");
        return;
      }

      console.log("Processing operation type:", operation.type);
      switch (operation.type) {
        case "element_start":
        case "element_add": {
          console.log("Processing element_start operation", operation);
          const element = operation.data?.element;
          if (element) {
            console.log("Adding collaborative element:", element);
            setCollaborativeElements((prev) => {
              const exists = prev.find((el) => el.id === element.id);
              if (exists) {
                console.log("Element already exists, skipping");
                return prev;
              }
              console.log("Adding new collaborative element", element);
              const newElements = [...prev, { ...element, isTemporary: true }];
              console.log("Collaborative elements count:", newElements.length);
              return newElements;
            });
          } else {
            console.warn("No element data in operation", operation);
          }
          break;
        }

        case "element_update": {
          console.log("Processing element_update operation", operation);
          setCollaborativeElements((prev) =>
            prev.map((el) =>
              el.id === operation.elementId ? { ...el, ...operation.data } : el
            )
          );
          break;
        }

        case "element_complete": {
          console.log("Processing element_complete operation", operation);
          const completeElement = operation.data?.element;
          if (completeElement) {
            setCollaborativeElements((prev) =>
              prev.map((el) =>
                el.id === operation.elementId
                  ? { ...el, ...completeElement, isTemporary: false }
                  : el
              )
            );
          }
          break;
        }

        case "element_delete": {
          console.log("Processing element_delete operation", operation);
          setCollaborativeElements((prev) =>
            prev.filter((el) => el.id !== operation.elementId)
          );
          break;
        }

        default:
          console.log("Unknown operation type:", operation.type);
      }
    };

    const handleRoomJoined = (event: CustomEvent) => {
      console.log("CanvasBoard: Room joined event received", event.detail);
      const { elements } = event.detail;
      console.log("Elements from room:", elements);
      if (elements && elements.length > 0) {
        console.log("Loading room elements:", elements);
        setCollaborativeElements(elements);
      } else {
        console.log("No elements to load from room");
      }
    };

    if (isCollaborating) {
      window.addEventListener(
        "collab_operation",
        handleCollabOperation as EventListener
      );
      window.addEventListener("room_joined", handleRoomJoined as EventListener);

      // Handle collaborative laser events
      const handleLaserPoint = (event: CustomEvent) => {
        const { userId, point, timestamp } = event.detail;
        setCollaborativeLaserTrails((prev) => {
          const newTrails = new Map(prev);
          const userTrail = newTrails.get(userId) || [];

          // Add new point with fade effect
          const newPoint = {
            point,
            opacity: 1,
            timestamp,
            color: "#ff0000", // Red for other users
          };

          // Keep recent points (last 2 seconds)
          const recentPoints = userTrail.filter(
            (p) => timestamp - p.timestamp < 2000
          );
          newTrails.set(userId, [...recentPoints, newPoint]);

          return newTrails;
        });
      };

      const handleLaserClear = (event: CustomEvent) => {
        const { userId } = event.detail;
        setCollaborativeLaserTrails((prev) => {
          const newTrails = new Map(prev);
          newTrails.delete(userId);
          return newTrails;
        });
      };

      window.addEventListener(
        "collab_laser_point",
        handleLaserPoint as EventListener
      );
      window.addEventListener(
        "collab_laser_clear",
        handleLaserClear as EventListener
      );

      return () => {
        window.removeEventListener(
          "collab_operation",
          handleCollabOperation as EventListener
        );
        window.removeEventListener(
          "room_joined",
          handleRoomJoined as EventListener
        );
        window.removeEventListener(
          "collab_laser_point",
          handleLaserPoint as EventListener
        );
        window.removeEventListener(
          "collab_laser_clear",
          handleLaserClear as EventListener
        );
      };
    }
  }, [isCollaborating, state.userId]);

  // Save in local storage and load from that
  useEffect(() => {
    const savedElements = loadFromLocalStorage();
    if (savedElements.length > 0 && !isCollaborating) {
      setLocalElements(savedElements);
    }

    const frameRef = animationFrame;

    // Cleanup image cache and animation frame when component unmounts
    return () => {
      ImageLoader.clear();
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isCollaborating]);

  // Auto-save for local mode
  useEffect(() => {
    if (!isCollaborating && localElements.length > 0) {
      const interval = setInterval(() => {
        saveToLocalStorage(localElements);
      }, AUTO_SAVE_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [localElements, isCollaborating]);

  // Listen for external canvas element updates (from import)
  useEffect(() => {
    const handleCanvasElementsUpdate = () => {
      if (!isCollaborating) {
        const updatedElements = loadFromLocalStorage();
        setLocalElements(updatedElements);
      }
    };

    window.addEventListener(
      "canvas-elements-updated",
      handleCanvasElementsUpdate
    );
    return () => {
      window.removeEventListener(
        "canvas-elements-updated",
        handleCanvasElementsUpdate
      );
    };
  }, [isCollaborating]);

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context
    ctx.save();

    // Apply transform
    ctx.translate(position.x, position.y);
    ctx.scale(scale, scale);

    // Create rough canvas
    const rc = rough.canvas(canvas);

    // Draw elements
    elements.forEach((element) => {
      const options = {
        stroke: element.strokeColor,
        strokeWidth: element.strokeWidth,
        roughness: element.roughness || 1,
        seed: element.seed || 1,
      };

      // Add visual indicator for elements being drawn by others in collaborative mode
      if (
        isCollaborating &&
        element.isTemporary &&
        element.authorId !== state.userId
      ) {
        ctx.save();
        ctx.globalAlpha = 0.7;
      }

      switch (element.type) {
        case "Image": {
          if (element.imageUrl && element.width && element.height) {
            // Check if the image is in viewport before loading/drawing
            const isVisible = isElementInViewport(
              element,
              canvas.width / window.devicePixelRatio,
              canvas.height / window.devicePixelRatio,
              position,
              scale
            );

            if (isVisible) {
              // Get image synchronously from cache
              const img = ImageLoader.getFromCache(element.imageUrl);
              if (img) {
                ctx.drawImage(
                  img,
                  element.x,
                  element.y,
                  element.width!,
                  element.height!
                );
              } else {
                // Load the image if not in cache
                ImageLoader.load(element.imageUrl)
                  .then(() => {
                    // Trigger a redraw once the image is loaded
                    redrawCanvas();
                  })
                  .catch((error) => {
                    console.error("Error loading image:", error);
                  });
              }
            }
          }
          break;
        }
        case "Rectangle": {
          if (element.width && element.height) {
            rc.rectangle(
              element.x,
              element.y,
              element.width,
              element.height,
              options
            );
          }
          break;
        }
        case "Diamond": {
          if (element.width && element.height) {
            const points: [number, number][] = [
              [element.x + element.width / 2, element.y], // top
              [element.x + element.width, element.y + element.height / 2], // right
              [element.x + element.width / 2, element.y + element.height], // bottom
              [element.x, element.y + element.height / 2], // left
            ];
            rc.polygon(points, options);
          }
          break;
        }

        case "Line": {
          if (element.width !== undefined && element.height !== undefined) {
            rc.line(
              element.x,
              element.y,
              element.x + element.width,
              element.y + element.height,
              options
            );
          }
          break;
        }
        case "Pencil": {
          if (element.points && element.points.length > 0) {
            ctx.save();
            ctx.strokeStyle = element.strokeColor;
            ctx.lineWidth = element.strokeWidth;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.globalCompositeOperation = "source-over";

            if (element.points.length === 1) {
              // Single point - draw a small circle
              ctx.beginPath();
              ctx.arc(
                element.points[0].x,
                element.points[0].y,
                element.strokeWidth / 2,
                0,
                2 * Math.PI
              );
              ctx.fill();
            } else if (element.points.length === 2) {
              // Two points - draw a straight line
              ctx.beginPath();
              ctx.moveTo(element.points[0].x, element.points[0].y);
              ctx.lineTo(element.points[1].x, element.points[1].y);
              ctx.stroke();
            } else {
              // Multiple points - draw smooth curve
              ctx.beginPath();
              ctx.moveTo(element.points[0].x, element.points[0].y);

              // Use quadratic curves for smoother drawing
              for (let i = 1; i < element.points.length - 1; i++) {
                const currentPoint = element.points[i];
                const nextPoint = element.points[i + 1];
                const cpx = (currentPoint.x + nextPoint.x) / 2;
                const cpy = (currentPoint.y + nextPoint.y) / 2;
                ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, cpx, cpy);
              }

              // Draw to the last point
              const lastPoint = element.points[element.points.length - 1];
              ctx.lineTo(lastPoint.x, lastPoint.y);
              ctx.stroke();
            }

            ctx.restore();
          }
          break;
        }

        case "Circle": {
          if (element.width && element.height) {
            rc.ellipse(
              element.x + element.width / 2,
              element.y + element.height / 2,
              Math.abs(element.width),
              Math.abs(element.height),
              options
            );
          }
          break;
        }
        case "Arrow": {
          if (element.width !== undefined && element.height !== undefined) {
            const endX = element.x + element.width;
            const endY = element.y + element.height;

            // Draw line
            rc.line(element.x, element.y, endX, endY, options);

            // Draw arrow head
            const angle = Math.atan2(element.height, element.width);
            const arrowLength = 20;
            const arrowAngle = Math.PI / 6;

            const arrow1X = endX - arrowLength * Math.cos(angle - arrowAngle);
            const arrow1Y = endY - arrowLength * Math.sin(angle - arrowAngle);
            const arrow2X = endX - arrowLength * Math.cos(angle + arrowAngle);
            const arrow2Y = endY - arrowLength * Math.sin(angle + arrowAngle);

            rc.line(endX, endY, arrow1X, arrow1Y, options);
            rc.line(endX, endY, arrow2X, arrow2Y, options);
          }
          break;
        }
        case "Text": {
          if (element.text && element.id !== editingTextId) {
            ctx.font = `${element.fontSize || 20}px ${
              element.fontFamily || "Virgil"
            }`;
            ctx.fillStyle = element.strokeColor || "#000";
            ctx.textBaseline = "top";
            ctx.fillText(element.text, element.x, element.y);
          }
          break;
        }
      }

      if (
        isCollaborating &&
        element.isTemporary &&
        element.authorId !== state.userId
      ) {
        ctx.restore();
      }
    });

    // Draw selection area if active
    if (selectionArea) {
      ctx.save();
      ctx.strokeStyle = "#007acc";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      const width = selectionArea.end.x - selectionArea.start.x;
      const height = selectionArea.end.y - selectionArea.start.y;
      ctx.strokeRect(
        selectionArea.start.x,
        selectionArea.start.y,
        width,
        height
      );
      ctx.restore();
    }

    // Draw selection highlight for all selected elements
    if (selectedElements.length > 0) {
      ctx.save();
      ctx.strokeStyle = "#007acc";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      const padding = 10;

      selectedElements.forEach((element) => {
        switch (element.type) {
          case "Rectangle":
          case "Diamond":
          case "Circle":
          case "Image": {
            if (element.width && element.height) {
              const minX = Math.min(element.x, element.x + element.width);
              const maxX = Math.max(element.x, element.x + element.width);
              const minY = Math.min(element.y, element.y + element.height);
              const maxY = Math.max(element.y, element.y + element.height);
              ctx.strokeRect(
                minX - padding,
                minY - padding,
                maxX - minX + padding * 2,
                maxY - minY + padding * 2
              );
            }
            break;
          }
          case "Line": {
            // Show selection only for Line, not Arrow
            if (element.width !== undefined && element.height !== undefined) {
              const endX = element.x + element.width;
              const endY = element.y + element.height;
              const minX = Math.min(element.x, endX);
              const maxX = Math.max(element.x, endX);
              const minY = Math.min(element.y, endY);
              const maxY = Math.max(element.y, endY);
              ctx.strokeRect(
                minX - padding,
                minY - padding,
                maxX - minX + padding * 2,
                maxY - minY + padding * 2
              );
            }
            break;
          }
          case "Arrow": {
            // Do not draw selection rectangle for Arrow
            break;
          }
          case "Text": {
            if (element.text) {
              const textWidth =
                element.text.length * (element.fontSize || 20) * 0.6;
              const textHeight = element.fontSize || 20;
              ctx.strokeRect(
                element.x - padding,
                element.y - padding,
                textWidth + padding * 2,
                textHeight + padding * 2
              );
            }
            break;
          }
          case "Pencil": {
            if (element.points && element.points.length > 0) {
              const xs = element.points.map((p) => p.x);
              const ys = element.points.map((p) => p.y);
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);
              ctx.strokeRect(
                minX - padding,
                minY - padding,
                maxX - minX + padding * 2,
                maxY - minY + padding * 2
              );
            }
            break;
          }
        }
      });
      ctx.restore();
    }

    const drawLaserTrail = (
      trail: Array<{ point: { x: number; y: number }; opacity?: number }>,
      color: string,
      opacity: number
    ) => {
      if (trail.length < 2) return;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Function to draw smooth path using quadratic curves
      const drawSmoothPath = () => {
        const points = trail.map((t) => t.point);

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        if (points.length === 2) {
          // For just 2 points, draw a straight line
          ctx.lineTo(points[1].x, points[1].y);
        } else {
          // For multiple points, use quadratic curves for smoothness
          for (let i = 0; i < points.length - 2; i++) {
            // ...existing code...
            const p1 = points[i + 1];
            const p2 = points[i + 2];

            // Calculate control point using Catmull-Rom style
            const cp1x = p1.x;
            const cp1y = p1.y;

            // Midpoint between current and next point
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            ctx.quadraticCurveTo(cp1x, cp1y, midX, midY);
          }

          // Draw to the last point
          const lastPoint = points[points.length - 1];
          const secondLastPoint = points[points.length - 2];
          ctx.quadraticCurveTo(
            secondLastPoint.x,
            secondLastPoint.y,
            lastPoint.x,
            lastPoint.y
          );
        }
      };

      // Draw outer glow
      ctx.shadowBlur = 20;
      ctx.lineWidth = 15;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.globalAlpha = opacity * 0.3;
      drawSmoothPath();
      ctx.stroke();

      // Draw middle layer
      ctx.shadowBlur = 10;
      ctx.lineWidth = 8;
      ctx.globalAlpha = opacity * 0.6;
      drawSmoothPath();
      ctx.stroke();

      // Draw core
      ctx.shadowBlur = 0;
      ctx.lineWidth = 3;
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = "#ffffff";
      drawSmoothPath();
      ctx.stroke();

      ctx.restore();
    };

    // Draw current user's laser trail
    if (selectedTool === "Laser" && laser.trail.length > 0) {
      drawLaserTrail(laser.trail, "#ff0000", 1.0);

      // Draw current laser point
      ctx.save();
      const lastPoint = laser.trail[laser.trail.length - 1].point;
      ctx.globalAlpha = 1;
      const gradient = ctx.createRadialGradient(
        lastPoint.x,
        lastPoint.y,
        0,
        lastPoint.x,
        lastPoint.y,
        5
      );
      gradient.addColorStop(0, "rgba(255, 0, 0, 1)");
      gradient.addColorStop(1, "rgba(255, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw collaborative laser trails from other users
    collaborativeLaserTrails.forEach((trail) => {
      if (trail.length > 0) {
        drawLaserTrail(trail, "#00ff00", 0.8); // Green for other users

        // Draw their current laser point
        ctx.save();
        const lastPoint = trail[trail.length - 1].point;
        ctx.globalAlpha = 0.8;
        const gradient = ctx.createRadialGradient(
          lastPoint.x,
          lastPoint.y,
          0,
          lastPoint.x,
          lastPoint.y,
          5
        );
        gradient.addColorStop(0, "rgba(0, 255, 0, 1)");
        gradient.addColorStop(1, "rgba(0, 255, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    ctx.restore();
  }, [
    elements,
    position,
    scale,
    selectedElement,
    selectedElements,
    editingTextId,
    selectedTool,
    laser.trail,
    selectionArea,
    isCollaborating,
    state.userId,
  ]);

  // Initialize canvas size
  // Handle delete key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedElement &&
        !isEditingText
      ) {
        e.preventDefault();
        setElements((prev) =>
          prev.filter((el) => el.id !== selectedElement.id)
        );
        setSelectedElement(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElement, isEditingText]);

  // Handle tool shortcuts
  useEffect(() => {
    const handleToolShortcuts = (e: KeyboardEvent) => {
      // Don't trigger shortcuts while editing text or if modifiers are pressed
      if (isEditingText || e.ctrlKey || e.altKey || e.metaKey) return;

      switch (e.key.toLowerCase()) {
        case "s":
          setSelectedTool("select");
          break;
        case "p":
          setSelectedTool("Pencil");
          break;
        case "t":
          setSelectedTool("Text");
          break;
        case "r":
          setSelectedTool("Rectangle");
          break;
        case "c":
          setSelectedTool("Circle");
          break;
        case "l":
          setSelectedTool("Line");
          break;
        case "a":
          setSelectedTool("Arrow");
          break;
        case "d":
          setSelectedTool("Diamond");
          break;
        case "q":
          setSelectedTool("Laser");
          break;
        case "e":
          setSelectedTool("Eraser");
          break;
      }
    };

    window.addEventListener("keydown", handleToolShortcuts);
    return () => window.removeEventListener("keydown", handleToolShortcuts);
  }, [isEditingText, setSelectedTool]);

  // Handle delete key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !isEditingText &&
        (selectedElements.length > 0 || selectedElement)
      ) {
        e.preventDefault();
        setElements((prev) =>
          prev.filter((el) => {
            // Remove elements that are either in selectedElements array or match selectedElement
            return (
              !selectedElements.some((selected) => selected.id === el.id) &&
              (!selectedElement || el.id !== selectedElement.id)
            );
          })
        );
        setSelectedElements([]);
        setSelectedElement(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElement, selectedElements, isEditingText]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }

      redrawCanvas();
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [redrawCanvas]);

  // Redraw canvas when elements change
  // Reference to track if component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isMounted.current) {
      requestAnimationFrame(redrawCanvas);
    }
  }, [elements, position, scale, redrawCanvas]);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    const handleWheelEvent = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(scale * delta, 0.1), 5);

        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setScale(newScale);
        setPosition((prev) => ({
          x: x - (x - prev.x) * delta,
          y: y - (y - prev.y) * delta,
        }));
      } else {
        setPosition((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    element.addEventListener("wheel", handleWheelEvent, { passive: false });
    return () => element.removeEventListener("wheel", handleWheelEvent);
  }, [scale]);

  const getTransformedPoint = useCallback(
    (e: React.MouseEvent): Position => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left - position.x) / scale,
        y: (e.clientY - rect.top - position.y) / scale,
      };
    },
    [position, scale]
  );

  const startTextEditing = useCallback((element: Element) => {
    setIsEditingText(true);
    setEditingTextId(element.id);
    setSelectedElement(element);

    // Add a small delay to ensure the textarea gets focus
    setTimeout(() => {
      const textarea = document.querySelector(
        'textarea[data-text-editing="true"]'
      ) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.select();
      }
    }, 50);
  }, []);

  const finishTextEditing = useCallback(
    (newText: string) => {
      if (editingTextId) {
        if (newText.trim()) {
          const updatedElement = elements.find((el) => el.id === editingTextId);
          if (updatedElement) {
            const completedElement = {
              ...updatedElement,
              text: newText.trim(),
              isTemporary: false,
            };

            setElements((prev) =>
              prev.map((el) =>
                el.id === editingTextId ? completedElement : el
              )
            );

            // Send collaboration update for text completion
            if (isCollaborating && sendOperation && state.roomId) {
              sendOperation({
                type: "element_complete",
                roomId: state.roomId,
                elementId: editingTextId,
                authorId: state.userId!,
                data: { element: completedElement },
              });
            }
          }
        } else {
          // Remove empty text elements
          setElements((prev) => prev.filter((el) => el.id !== editingTextId));
          setSelectedElement(null);

          // Send collaboration update for text deletion
          if (isCollaborating && sendOperation && state.roomId) {
            sendOperation({
              type: "element_delete",
              roomId: state.roomId,
              elementId: editingTextId,
              authorId: state.userId!,
              data: {},
            });
          }
        }
      }

      setIsEditingText(false);
      setEditingTextId(null);
    },
    [
      editingTextId,
      elements,
      isCollaborating,
      sendOperation,
      state.roomId,
      state.userId,
    ]
  );

  // Handle clicking outside text input to finish editing
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isEditingText) {
        const textarea = document.querySelector(
          'textarea[data-text-editing="true"]'
        ) as HTMLTextAreaElement;
        if (textarea && !textarea.contains(e.target as Node)) {
          finishTextEditing(textarea.value);
        }
      }
    };

    if (isEditingText) {
      // Add a small delay to prevent immediate triggering
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 200);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isEditingText, finishTextEditing]);

  // Hit detection for elements
  const getElementAtPoint = useCallback(
    (point: Position): Element | null => {
      // Check in reverse order (top elements first)
      for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];

        switch (element.type) {
          case "Rectangle":
          case "Diamond":
          case "Circle":
          case "Image": {
            if (element.width && element.height) {
              const minX = Math.min(element.x, element.x + element.width);
              const maxX = Math.max(element.x, element.x + element.width);
              const minY = Math.min(element.y, element.y + element.height);
              const maxY = Math.max(element.y, element.y + element.height);

              if (
                point.x >= minX &&
                point.x <= maxX &&
                point.y >= minY &&
                point.y <= maxY
              ) {
                return element;
              }
            }
            break;
          }
          case "Line":
          case "Arrow": {
            if (element.width !== undefined && element.height !== undefined) {
              // Simple line hit detection with some tolerance
              const tolerance = 10;
              const endX = element.x + element.width;
              const endY = element.y + element.height;

              // Distance from point to line
              const A = point.x - element.x;
              const B = point.y - element.y;
              const C = endX - element.x;
              const D = endY - element.y;

              const dot = A * C + B * D;
              const lenSq = C * C + D * D;

              if (lenSq === 0) continue;

              const param = dot / lenSq;

              let xx, yy;
              if (param < 0) {
                xx = element.x;
                yy = element.y;
              } else if (param > 1) {
                xx = endX;
                yy = endY;
              } else {
                xx = element.x + param * C;
                yy = element.y + param * D;
              }

              const dx = point.x - xx;
              const dy = point.y - yy;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance <= tolerance) {
                return element;
              }
            }
            break;
          }
          case "Text": {
            if (element.text) {
              // Approximate text bounds
              const textWidth =
                element.text.length * (element.fontSize || 20) * 0.6;
              const textHeight = element.fontSize || 20;

              if (
                point.x >= element.x &&
                point.x <= element.x + textWidth &&
                point.y >= element.y &&
                point.y <= element.y + textHeight
              ) {
                return element;
              }
            }
            break;
          }
          case "Pencil": {
            if (element.points && element.points.length > 0) {
              const tolerance = 10;

              for (const p of element.points) {
                const distance = Math.sqrt(
                  Math.pow(point.x - p.x, 2) + Math.pow(point.y - p.y, 2)
                );
                if (distance <= tolerance) {
                  return element;
                }
              }
            }
            break;
          }
        }
      }
      return null;
    },
    [elements]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Don't interfere with text editing
      if (isEditingText) {
        return;
      }

      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        setStartPan({ x: e.clientX - position.x, y: e.clientY - position.y });
        return;
      }

      const point = getTransformedPoint(e);

      // Handle select tool - check for element selection/dragging or start area selection
      if (selectedTool === "select") {
        const clickedElement = getElementAtPoint(point);

        if (clickedElement) {
          // Check if clicked element is part of multi-selection
          if (selectedElements.includes(clickedElement) && !e.shiftKey) {
            // Keep multi-selection and prepare for dragging
            setIsDragging(true);
            setDragOffset({
              x: point.x - clickedElement.x,
              y: point.y - clickedElement.y,
            });
          } else {
            // Select single element and prepare for dragging
            if (!e.shiftKey) {
              setSelectedElements([clickedElement]);
            } else {
              setSelectedElements((prev) => [...prev, clickedElement]);
            }
            setSelectedElement(clickedElement);
            setIsDragging(true);
            setDragOffset({
              x: point.x - clickedElement.x,
              y: point.y - clickedElement.y,
            });
          }
        } else {
          // Start area selection
          setSelectionArea({ start: point, end: point });
          if (!e.shiftKey) {
            // Clear previous selection unless shift is held
            setSelectedElements([]);
            setSelectedElement(null);
          }
        }

        // Check if clicking on a resize handle
        const handles = getResizeHandles(selectedElement);
        for (const handle of handles) {
          const dx = point.x - handle.x;
          const dy = point.y - handle.y;
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && selectedElement) {
            setResizing({
              corner: handle.corner,
              elementId: selectedElement.id,
            });
            setResizeStart(point);
            return;
          }
        }
        return;
      }

      // Handle Text tool - create text immediately and start editing
      if (selectedTool === "Text") {
        const elementId = isCollaborating
          ? `${state.userId || "local"}-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`
          : Date.now().toString();

        const newElement: Element = {
          id: elementId,
          type: selectedTool,
          x: point.x,
          y: point.y,
          strokeColor,
          strokeWidth,
          roughness: 1,
          seed: Math.floor(Math.random() * 1000),
          text: "Type here...",
          fontSize: 20,
          fontFamily: "Virgil",
          authorId: isCollaborating ? state.userId || "local" : "local",
          isTemporary: true,
        };

        setElements((prev) => [...prev, newElement]);
        startTextEditing(newElement);

        if (isCollaborating && sendOperation && state.roomId) {
          sendOperation({
            type: "element_start",
            roomId: state.roomId,
            elementId: newElement.id,
            authorId: state.userId!,
            data: { element: newElement, tool: selectedTool },
          });
        }
        return;
      }

      // Handle Image tool - trigger file input
      // will handle its collab later
      if (selectedTool === "Image") {
        const input = document.getElementById(
          "imageUpload"
        ) as HTMLInputElement;
        input?.click();
        return;
      }

      // Handle Eraser tool - immediate erasing on mousedown
      if (selectedTool === "Eraser") {
        const point = getTransformedPoint(e);
        setEraserPos(point);
        const newElements = eraseElements(elements, point, ERASER_RADIUS);
        setElements(newElements);

        if (isCollaborating && sendOperation && state.roomId) {
          const erasedElements = elements.filter(
            (el) => !newElements.includes(el)
          );
          erasedElements.forEach((el) => {
            sendOperation({
              type: "element_delete",
              roomId: state.roomId,
              elementId: el.id,
              authorId: state.userId!,
              data: {},
            });
          });
        }
        return;
      }

      // Handle other drawing tools
      setDrawing(true);
      setSelectedElement(null); // Clear selection when drawing

      const newElement: Element = {
        id: Date.now().toString(),
        type: selectedTool,
        x: point.x,
        y: point.y,
        strokeColor,
        strokeWidth,
        roughness: 1,
        seed: Math.floor(Math.random() * 1000),
        points: selectedTool === "Pencil" ? [point] : undefined,
        authorId: isCollaborating ? state.userId || "local" : "local",
        isTemporary: true,
      };

      setCurrentElement(newElement);
      setElements((prev) => [...prev, newElement]);

      if (isCollaborating && sendOperation && state.roomId) {
        sendOperation({
          type: "element_start",
          roomId: state.roomId,
          elementId: newElement.id,
          authorId: state.userId!,
          data: { element: newElement, tool: selectedTool },
        });

        updateDrawingStatus(true, newElement.id);
      }
    },
    [
      isEditingText,
      getTransformedPoint,
      updateCursor,
      isCollaborating,
      position,
      selectedTool,
      getElementAtPoint,
      strokeColor,
      strokeWidth,
      elements,
      sendOperation,
      state.userId,
      state.roomId,
      setElements,
      updateDrawingStatus,
      selectedElements,
      startTextEditing,
      setSelectedElement,
      selectedElement,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const point = getTransformedPoint(e);

      // Update cursor for collaborators
      if (isCollaborating && !isPanning && !drawing) {
        updateCursor(point);
      }

      if (isPanning) {
        requestAnimationFrame(() => {
          const newX = e.clientX - startPan.x;
          const newY = e.clientY - startPan.y;
          setPosition({ x: newX, y: newY });
        });
        return;
      }

      // Laser tool: handle trail
      if (selectedTool === "Laser") {
        if (e.buttons === 1) {
          // Only add points when mouse button is pressed
          laser.addPoint(point);

          // Send laser point to collaborators
          if (isCollaborating && updateCursor && state.roomId) {
            updateCursor({ x: point.x, y: point.y });

            // Send laser trail point to other users
            if (state.socket) {
              state.socket.emit("laser_point", {
                roomId: state.roomId,
                point: point,
                userId: state.userId,
                timestamp: Date.now(),
              });
            }
          }
        } else {
          laser.clearTrail();

          // Send laser clear to collaborators
          if (isCollaborating && state.socket && state.roomId) {
            state.socket.emit("laser_clear", {
              roomId: state.roomId,
              userId: state.userId,
            });
          }
        }
        return;
      }

      // Eraser tool: show cursor and erase elements
      if (selectedTool === "Eraser") {
        setEraserPos(point);
        if (e.buttons === 1) {
          const newElements = eraseElements(elements, point, ERASER_RADIUS);
          setElements(newElements);

          if (isCollaborating && sendOperation && state.roomId) {
            const erasedElements = elements.filter(
              (el) => !newElements.includes(el)
            );
            erasedElements.forEach((el) => {
              sendOperation({
                type: "element_delete",
                roomId: state.roomId!,
                elementId: el.id,
                authorId: state.userId!,
                data: {},
              });
            });
          }
        }
        return;
      }

      // Handle selection area
      if (
        selectedTool === "select" &&
        e.buttons === 1 &&
        !isDragging &&
        !resizing
      ) {
        setSelectionArea((prev) => ({
          start: prev?.start || point,
          end: point,
        }));

        const selectionRect = {
          left: Math.min(selectionArea?.start.x || point.x, point.x),
          right: Math.max(selectionArea?.start.x || point.x, point.x),
          top: Math.min(selectionArea?.start.y || point.y, point.y),
          bottom: Math.max(selectionArea?.start.y || point.y, point.y),
        };

        const elementsInSelection = elements.filter((el) => {
          switch (el.type) {
            case "Rectangle":
            case "Diamond":
            case "Circle":
            case "Image": {
              if (el.width && el.height) {
                const elRect = {
                  left: Math.min(el.x, el.x + el.width),
                  right: Math.max(el.x, el.x + el.width),
                  top: Math.min(el.y, el.y + el.height),
                  bottom: Math.max(el.y, el.y + el.height),
                };
                return (
                  elRect.left <= selectionRect.right &&
                  elRect.right >= selectionRect.left &&
                  elRect.top <= selectionRect.bottom &&
                  elRect.bottom >= selectionRect.top
                );
              }
              return false;
            }
            case "Line":
            case "Arrow": {
              if (el.width !== undefined && el.height !== undefined) {
                const endX = el.x + el.width;
                const endY = el.y + el.height;
                const elRect = {
                  left: Math.min(el.x, endX),
                  right: Math.max(el.x, endX),
                  top: Math.min(el.y, endY),
                  bottom: Math.max(el.y, endY),
                };
                return (
                  elRect.left <= selectionRect.right &&
                  elRect.right >= selectionRect.left &&
                  elRect.top <= selectionRect.bottom &&
                  elRect.bottom >= selectionRect.top
                );
              }
              return false;
            }
            case "Text": {
              if (el.text) {
                const textWidth = el.text.length * (el.fontSize || 20) * 0.6;
                const textHeight = el.fontSize || 20;
                const elRect = {
                  left: el.x,
                  right: el.x + textWidth,
                  top: el.y,
                  bottom: el.y + textHeight,
                };
                return (
                  elRect.left <= selectionRect.right &&
                  elRect.right >= selectionRect.left &&
                  elRect.top <= selectionRect.bottom &&
                  elRect.bottom >= selectionRect.top
                );
              }
              return false;
            }
            case "Pencil": {
              if (el.points && el.points.length > 0) {
                const xs = el.points.map((p) => p.x);
                const ys = el.points.map((p) => p.y);
                const elRect = {
                  left: Math.min(...xs),
                  right: Math.max(...xs),
                  top: Math.min(...ys),
                  bottom: Math.max(...ys),
                };
                return (
                  elRect.left <= selectionRect.right &&
                  elRect.right >= selectionRect.left &&
                  elRect.top <= selectionRect.bottom &&
                  elRect.bottom >= selectionRect.top
                );
              }
              return false;
            }
            default:
              return false;
          }
        });
        setSelectedElements(elementsInSelection);
        return;
      }

      // Handle element dragging
      if (isDragging) {
        const newX = point.x - dragOffset.x;
        const newY = point.y - dragOffset.y;

        setElements((prev) => {
          const updated = prev.map((el) => {
            if (selectedElements.some((selected) => selected.id === el.id)) {
              const newElement = { ...el };
              if (el.type === "Pencil" && el.points) {
                // For pencil, move all points
                const deltaX = newX - el.x;
                const deltaY = newY - el.y;
                newElement.x = newX;
                newElement.y = newY;
                newElement.points = el.points.map((p) => ({
                  x: p.x + deltaX,
                  y: p.y + deltaY,
                }));
              } else {
                // For other elements, just move the position
                newElement.x = newX;
                newElement.y = newY;
              }

              // Send operation for collaborative mode
              if (
                isCollaborating &&
                sendOperation &&
                state.roomId &&
                state.userId
              ) {
                sendOperation({
                  type: "element_update",
                  roomId: state.roomId!,
                  elementId: el.id,
                  authorId: state.userId!,
                  data: {
                    x: newElement.x,
                    y: newElement.y,
                    ...(newElement.points ? { points: newElement.points } : {}),
                  },
                });
              }

              return newElement;
            }
            return el;
          });

          return updated;
        });

        // Update selected element reference
        setSelectedElement((prev) =>
          prev ? { ...prev, x: newX, y: newY } : null
        );
        return;
      }

      // Handle resizing
      if (resizing && resizeStart && selectedElement) {
        setElements((prev) => {
          let updatedElement: Element | null = null;
          const updated = prev.map((el) => {
            if (el.id !== resizing.elementId) return el;
            switch (el.type) {
              case "Image": {
                // For images, maintain aspect ratio
                const aspectRatio = el.aspectRatio || 1;
                let newWidth = 0;
                let newHeight = 0;
                let newX = el.x;
                let newY = el.y;

                switch (resizing.corner) {
                  case "tl": {
                    newWidth = el.x + (el.width || 0) - point.x;
                    newHeight = newWidth / aspectRatio;
                    newX = point.x;
                    newY = el.y + (el.height || 0) - newHeight;
                    break;
                  }
                  case "tr": {
                    newWidth = point.x - el.x;
                    newHeight = newWidth / aspectRatio;
                    newY = el.y + (el.height || 0) - newHeight;
                    break;
                  }
                  case "br": {
                    newWidth = point.x - el.x;
                    newHeight = newWidth / aspectRatio;
                    break;
                  }
                  case "bl": {
                    newWidth = el.x + (el.width || 0) - point.x;
                    newHeight = newWidth / aspectRatio;
                    newX = point.x;
                    break;
                  }
                }

                if (newWidth > 10 && newHeight > 10) {
                  // Prevent too small sizes
                  updatedElement = {
                    ...el,
                    x: newX,
                    y: newY,
                    width: newWidth,
                    height: newHeight,
                  };

                  // Send operation for collaborative mode
                  if (
                    isCollaborating &&
                    sendOperation &&
                    state.roomId &&
                    state.userId
                  ) {
                    sendOperation({
                      type: "element_update",
                      roomId: state.roomId!,
                      elementId: el.id,
                      authorId: state.userId!,
                      data: {
                        x: newX,
                        y: newY,
                        width: newWidth,
                        height: newHeight,
                      },
                    });
                  }

                  return updatedElement;
                }
                return el;
              }
              case "Rectangle":
              case "Diamond":
              case "Circle": {
                let newX = el.x;
                let newY = el.y;
                let newWidth = el.width || 0;
                let newHeight = el.height || 0;

                switch (resizing.corner) {
                  case "tl": {
                    newWidth = el.x + (el.width || 0) - point.x;
                    newHeight = el.y + (el.height || 0) - point.y;
                    newX = point.x;
                    newY = point.y;
                    break;
                  }
                  case "tr": {
                    newWidth = point.x - el.x;
                    newHeight = el.y + (el.height || 0) - point.y;
                    newY = point.y;
                    break;
                  }
                  case "br": {
                    newWidth = point.x - el.x;
                    newHeight = point.y - el.y;
                    break;
                  }
                  case "bl": {
                    newWidth = el.x + (el.width || 0) - point.x;
                    newHeight = point.y - el.y;
                    newX = point.x;
                    break;
                  }
                }

                updatedElement = {
                  ...el,
                  x: newX,
                  y: newY,
                  width: newWidth,
                  height: newHeight,
                };

                // Send operation for collaborative mode
                if (
                  isCollaborating &&
                  sendOperation &&
                  state.roomId &&
                  state.userId
                ) {
                  sendOperation({
                    type: "element_update",
                    roomId: state.roomId!,
                    elementId: el.id,
                    authorId: state.userId!,
                    data: {
                      x: newX,
                      y: newY,
                      width: newWidth,
                      height: newHeight,
                    },
                  });
                }

                return updatedElement;
              }
              case "Line":
              case "Arrow": {
                updatedElement = {
                  ...el,
                  x: resizing.corner === "start" ? point.x : el.x,
                  y: resizing.corner === "start" ? point.y : el.y,
                  width:
                    resizing.corner === "start"
                      ? el.x + (el.width || 0) - point.x
                      : point.x - el.x,
                  height:
                    resizing.corner === "start"
                      ? el.y + (el.height || 0) - point.y
                      : point.y - el.y,
                };

                // Send operation for collaborative mode
                if (
                  isCollaborating &&
                  sendOperation &&
                  state.roomId &&
                  state.userId
                ) {
                  sendOperation({
                    type: "element_update",
                    roomId: state.roomId!,
                    elementId: el.id,
                    authorId: state.userId!,
                    data: {
                      x: updatedElement.x,
                      y: updatedElement.y,
                      width: updatedElement.width,
                      height: updatedElement.height,
                    },
                  });
                }

                return updatedElement;
              }
              default:
                return el;
            }
          });

          // Update selectedElement to match the resized shape
          if (updatedElement) setSelectedElement(updatedElement);
          return updated;
        });
        return;
      }

      // Handle drawing for non-select tools
      if (!drawing || !currentElement) return;

      setElements((prev) => {
        const index = prev.findIndex((el) => el.id === currentElement.id);
        if (index === -1) return prev;
        const updated = [...prev];

        switch (currentElement.type) {
          case "Rectangle":
          case "Diamond":
          case "Circle":
          case "Arrow":
          case "Line": {
            const updatedElement = {
              ...currentElement,
              width: point.x - currentElement.x,
              height: point.y - currentElement.y,
            };
            updated[index] = updatedElement;

            // Send operation for collaborative mode
            if (
              isCollaborating &&
              sendOperation &&
              state.roomId &&
              state.userId
            ) {
              sendOperation({
                type: "element_update",
                roomId: state.roomId!,
                elementId: currentElement.id,
                authorId: state.userId!,
                data: {
                  width: updatedElement.width,
                  height: updatedElement.height,
                },
              });
            }
            break;
          }
          case "Pencil": {
            const currentPoints = updated[index].points || [];
            const lastPoint = currentPoints[currentPoints.length - 1];
            const distance = lastPoint
              ? Math.sqrt(
                  Math.pow(point.x - lastPoint.x, 2) +
                    Math.pow(point.y - lastPoint.y, 2)
                )
              : 0;

            if (!lastPoint || distance > 1) {
              const newPoints = [...currentPoints, point];
              updated[index] = { ...updated[index], points: newPoints };

              // Your provided snippet for Pencil updates
              if (
                isCollaborating &&
                sendOperation &&
                state.roomId &&
                state.userId
              ) {
                sendOperation({
                  type: "element_update",
                  roomId: state.roomId!,
                  elementId: currentElement.id,
                  authorId: state.userId!,
                  data: { points: newPoints },
                });
              }
            }
            break;
          }
        }

        return updated;
      });
    },
    [
      getTransformedPoint,
      isCollaborating,
      updateCursor,
      isPanning,
      startPan,
      selectedTool,
      laser,
      elements,
      currentElement,
      isDragging,
      dragOffset,
      resizing,
      resizeStart,
      selectionArea,
      selectedElements,
      sendOperation,
      state.roomId,
      state.userId,
      setElements,
      setSelectedElement,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (
      drawing &&
      currentElement &&
      isCollaborating &&
      sendOperation &&
      state.roomId
    ) {
      // Complete the element
      const completedElement = { ...currentElement, isTemporary: false };
      setElements((prev) =>
        prev.map((el) => (el.id === currentElement.id ? completedElement : el))
      );

      sendOperation({
        type: "element_complete",
        roomId: state.roomId!,
        elementId: currentElement.id,
        authorId: state.userId!,
        data: { element: completedElement },
      });

      updateDrawingStatus(false);
    }

    setDrawing(false);
    setCurrentElement(null);
    setIsPanning(false);
    setIsDragging(false);
    setResizing(null);
    setResizeStart(null);
    setSelectionArea(null);
    // Switch back to select tool after drawing a shape (not for select, Text, Pencil or Eraser)
    if (
      selectedTool !== "select" &&
      selectedTool !== "Eraser" &&
      selectedTool !== "Pencil" &&
      selectedTool !== "Laser"
    ) {
      setSelectedTool("select");
    }
  }, [selectedTool, setSelectedTool]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      // Only handle double-click for text editing when using select tool
      if (selectedTool !== "select") return;

      const point = getTransformedPoint(e);
      const clickedElement = getElementAtPoint(point);

      if (clickedElement && clickedElement.type === "Text") {
        startTextEditing(clickedElement);
      } else {
        setSelectedTool("Text");
      }
    },
    [
      selectedTool,
      getTransformedPoint,
      getElementAtPoint,
      startTextEditing,
      setSelectedTool,
    ]
  );

  // Handle image upload
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            // Get the visible canvas area (accounting for scale and position)
            const visibleWidth = canvas.width / window.devicePixelRatio / scale;
            const visibleHeight =
              canvas.height / window.devicePixelRatio / scale;

            // Calculate maximum dimensions (50% of visible area)
            const maxWidth = visibleWidth * 0.5;
            const maxHeight = visibleHeight * 0.5;

            // Calculate dimensions maintaining aspect ratio
            const aspectRatio = img.width / img.height;
            let newWidth = img.width;
            let newHeight = img.height;

            if (newWidth > maxWidth) {
              newWidth = maxWidth;
              newHeight = newWidth / aspectRatio;
            }
            if (newHeight > maxHeight) {
              newHeight = maxHeight;
              newWidth = newHeight * aspectRatio;
            }

            // Calculate center position in visible area
            const centerX = -position.x / scale + (visibleWidth - newWidth) / 2;
            const centerY =
              -position.y / scale + (visibleHeight - newHeight) / 2;

            const newElement: Element = {
              id: Date.now().toString(),
              type: "Image",
              x: centerX,
              y: centerY,
              width: newWidth,
              height: newHeight,
              strokeColor: strokeColor,
              strokeWidth: strokeWidth,
              imageUrl: imageUrl,
              aspectRatio: aspectRatio,
            };

            setElements((prev) => [...prev, newElement]);
            setSelectedElement(newElement);
            setSelectedTool("select"); // Switch to select tool after placing image

            // Send collaborative operation for image upload
            if (isCollaborating) {
              console.log("Sending image upload operation:", newElement);
              sendOperation({
                type: "element_create",
                element: newElement,
                roomId: state.roomId,
                userId: state.userId,
              });
            }
          };
          img.src = imageUrl;
        };
        reader.readAsDataURL(file);
      }
    },
    [
      strokeColor,
      strokeWidth,
      setSelectedTool,
      scale,
      position,
      canvasRef,
      isCollaborating,
      sendOperation,
      state.roomId,
      state.userId,
    ]
  );

  // Reset state when session ends
  useEffect(() => {
    if (!isCollaborating) {
      setCollaborativeElements([]);
      setCurrentElement(null);
      setSelectedElement(null);
      setSelectedElements([]);
      setDrawing(false);
      setIsPanning(false);
      setIsDragging(false);
      setResizing(null);
      setResizeStart(null);
      setEraserPos(null);
      setSelectionArea(null);
      setEditingTextId(null);
      setIsEditingText(false);
    }
  }, [isCollaborating]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden bg-dot-pattern"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      style={{
        cursor: isPanning
          ? "grabbing"
          : selectedTool === "Pencil"
          ? "crosshair"
          : selectedTool === "Eraser"
          ? "none"
          : "default",
      }}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="imageUpload"
        onChange={handleImageUpload}
      />
      <canvas ref={canvasRef} className="absolute top-0 left-0" />

      {/* Collaborative Features */}
      {isCollaborating && (
        <>
          {/* Room Info */}
          <div className="absolute right-0 top-0 text-align-center p-4 z-10">
            Room: {state.roomId}
          </div>

          {/* Connection Status */}
          <ConnectionStatus
            isConnected={isConnected}
            collaborators={collaborators}
          />

          {/* Collaborator Cursors */}
          {collaborators.map(
            (collaborator) =>
              collaborator.cursor &&
              collaborator.id !== state.userId && (
                <CollabCursor
                  key={collaborator.id}
                  collaborator={collaborator}
                  position={position}
                  scale={scale}
                />
              )
          )}
        </>
      )}

      {/* Text Input Overlay */}
      {isEditingText && selectedElement && selectedElement.type === "Text" && (
        <textarea
          data-text-editing="true"
          className="absolute z-50 resize-none border-2 border-blue-500 rounded-md px-2 py-1 
                     bg-white shadow-lg outline-none text-black
                     animate-in fade-in duration-150"
          style={{
            left: `${Math.max(0, selectedElement.x * scale + position.x)}px`,
            top: `${Math.max(0, selectedElement.y * scale + position.y)}px`,
            fontSize: `${selectedElement.fontSize || 20}px`,
            fontFamily: "Virgil, Arial, sans-serif",
            width: "200px",
            minHeight: "40px",
            lineHeight: "1.2",
            pointerEvents: "auto",
          }}
          defaultValue={selectedElement.text || ""}
          placeholder="Type your text..."
          autoFocus
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Escape") {
              finishTextEditing("");
            } else if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              finishTextEditing(e.currentTarget.value);
            }
          }}
          onFocus={(e) => {
            e.currentTarget.select();
          }}
        />
      )}

      {/* Resize Handles */}
      {selectedTool === "select" &&
        selectedElement &&
        ["Rectangle", "Diamond", "Circle", "Line", "Arrow", "Image"].includes(
          selectedElement.type
        ) &&
        getResizeHandles(selectedElement).map((handle, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: `${handle.x * scale + position.x - 6}px`,
              top: `${handle.y * scale + position.y - 6}px`,
              width: "12px",
              height: "12px",
              background: "#fff",
              border: "2px solid #007acc",
              borderRadius: "3px",
              cursor: handle.cursor,
              zIndex: 100,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (selectedElement) {
                setResizing({
                  corner: handle.corner,
                  elementId: selectedElement.id,
                });
                setResizeStart(getTransformedPoint(e));
              }
            }}
          />
        ))}

      {/* Eraser Cursor Overlay */}
      {selectedTool === "Eraser" && eraserPos && (
        <div
          style={{
            position: "absolute",
            left: `${eraserPos.x * scale + position.x - ERASER_RADIUS}px`,
            top: `${eraserPos.y * scale + position.y - ERASER_RADIUS}px`,
            width: `${ERASER_RADIUS * 2}px`,
            height: `${ERASER_RADIUS * 2}px`,
            border: "2px solid #007acc",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            pointerEvents: "none",
            zIndex: 200,
          }}
        />
      )}
    </div>
  );
};
