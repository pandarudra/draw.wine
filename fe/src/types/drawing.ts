export type ToolType =
  | "select"
  | "Rectangle"
  | "Diamond"
  | "Circle"
  | "Arrow"
  | "Line"
  | "Pencil"
  | "Text"
  | "Image"
  | "Eraser"
  | "Laser";

export interface DrawingContextType {
  selectedTool: ToolType;
  setSelectedTool: (tool: ToolType) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  fillColor: string | null;
  setFillColor: (color: string | null) => void;
  activeElementTypes: ToolType[];
  setActiveElementTypes: (types: ToolType[]) => void;
}
