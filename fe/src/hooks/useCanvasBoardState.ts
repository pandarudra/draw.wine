import { useRef, useState } from "react";
import type { Element, Position } from "@/types/element";

type ResizeState = { corner: string; elementId: string } | null;

type SelectionArea = { start: Position; end: Position } | null;

type LaserTrailPoint = {
  point: { x: number; y: number };
  opacity: number;
  timestamp: number;
  color: string;
};

export const useCanvasBoardState = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrame = useRef<number | null>(null);
  const isMounted = useRef(true);

  const [localElements, setLocalElements] = useState<Element[]>([]);
  const [collaborativeElements, setCollaborativeElements] = useState<Element[]>(
    [],
  );
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
  const [resizing, setResizing] = useState<ResizeState>(null);
  const [resizeStart, setResizeStart] = useState<Position | null>(null);
  const [eraserPos, setEraserPos] = useState<Position | null>(null);
  const [selectionArea, setSelectionArea] = useState<SelectionArea>(null);
  const [selectedElements, setSelectedElements] = useState<Element[]>([]);
  const [collaborativeLaserTrails, setCollaborativeLaserTrails] = useState<
    Map<string, Array<LaserTrailPoint>>
  >(new Map());

  return {
    canvasRef,
    containerRef,
    animationFrame,
    isMounted,
    localElements,
    setLocalElements,
    collaborativeElements,
    setCollaborativeElements,
    drawing,
    setDrawing,
    position,
    setPosition,
    startPan,
    setStartPan,
    scale,
    setScale,
    currentElement,
    setCurrentElement,
    isPanning,
    setIsPanning,
    isEditingText,
    setIsEditingText,
    editingTextId,
    setEditingTextId,
    selectedElement,
    setSelectedElement,
    isDragging,
    setIsDragging,
    dragOffset,
    setDragOffset,
    resizing,
    setResizing,
    resizeStart,
    setResizeStart,
    eraserPos,
    setEraserPos,
    selectionArea,
    setSelectionArea,
    selectedElements,
    setSelectedElements,
    collaborativeLaserTrails,
    setCollaborativeLaserTrails,
  };
};
