import { createContext, useContext, useState } from "react";

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
  | "Eraser";

interface DrawingContextType {
  selectedTool: ToolType;
  setSelectedTool: (tool: ToolType) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
}

const DrawingContext = createContext<DrawingContextType | null>(null);

export const DrawingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedTool, setSelectedTool] = useState<ToolType>("select");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);

  return (
    <DrawingContext.Provider
      value={{
        selectedTool,
        setSelectedTool,
        strokeColor,
        setStrokeColor,
        strokeWidth,
        setStrokeWidth,
      }}
    >
      {children}
    </DrawingContext.Provider>
  );
};

export const useDrawing = () => {
  const context = useContext(DrawingContext);
  if (!context) {
    throw new Error("useDrawing must be used within a DrawingProvider");
  }
  return context;
};
