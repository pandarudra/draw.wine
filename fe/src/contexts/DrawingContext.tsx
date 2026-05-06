import { createContext, useContext, useState } from "react";
import type { ToolType, DrawingContextType } from "@/types/drawing";

const DrawingContext = createContext<DrawingContextType | null>(null);

export const DrawingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedTool, setSelectedTool] = useState<ToolType>("select");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fillColor, setFillColor] = useState<string | null>(null);
  const [activeElementTypes, setActiveElementTypes] = useState<ToolType[]>([]);

  return (
    <DrawingContext.Provider
      value={{
        selectedTool,
        setSelectedTool,
        strokeColor,
        setStrokeColor,
        strokeWidth,
        setStrokeWidth,
        fillColor,
        setFillColor,
        activeElementTypes,
        setActiveElementTypes,
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
