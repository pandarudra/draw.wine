import { useDrawing } from "@/contexts/DrawingContext";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Minus } from "lucide-react";

const STROKE_COLORS = [
  "#000000", // Black
  "#e03131", // Red
  "#2f9e44", // Green
  "#1971c2", // Blue
  "#f08c00", // Orange
  "#9c36b5", // Grape
  "#099268", // Teal
  "#868e96", // Gray
  "#d9480f", // Burnt Orange
  "#1098ad", // Cyan
];

const STROKE_WIDTHS = [
  { value: 1, icon: <Minus className="h-4 w-4 stroke-[1]" /> },
  { value: 3, icon: <Minus className="h-5 w-5 stroke-[3]" /> },
  { value: 5, icon: <Minus className="h-6 w-6 stroke-[5]" /> },
];

export const PropertiesPanel = () => {
  const {
    selectedTool,
    strokeColor,
    setStrokeColor,
    strokeWidth,
    setStrokeWidth,
  } = useDrawing();

  // Do not show the properties panel if the tool doesn't require stroke properties.
  // We can expand this list if more tools are added.
  if (
    selectedTool === "select" ||
    selectedTool === "Eraser" ||
    selectedTool === "Image"
  ) {
    return null;
  }

  return (
    <div className="bg-background/80 backdrop-blur-md border border-border p-4 rounded-xl shadow-lg w-56 flex flex-col space-y-6">
      {/* Stroke Color Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Stroke
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {STROKE_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setStrokeColor(color)}
              className={cn(
                "w-8 h-8 rounded-md transition-all hover:scale-110 stroke-color-swatch",
                strokeColor === color
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "border border-border/50",
              )}
              style={{ "--stroke-color": color } as CSSProperties}
              title={color}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Stroke Width Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Stroke Width
        </h3>
        <div className="flex bg-muted/50 rounded-lg p-1 border">
          {STROKE_WIDTHS.map((width) => (
            <button
              key={width.value}
              onClick={() => setStrokeWidth(width.value)}
              className={cn(
                "flex-1 flex items-center justify-center p-2 rounded-md transition-colors",
                strokeWidth === width.value
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
              title={`${width.value}px`}
              aria-label={`Select stroke width ${width.value}`}
            >
              {width.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
