import { useDrawing } from "@/contexts/DrawingContext";
import type { CSSProperties } from "react";
import { cn } from "@/helpers/cn.h";
import { STROKE_COLORS, STROKE_WIDTHS } from "@/constants/ext";

export const PropertiesPanel = () => {
  const {
    selectedTool,
    strokeColor,
    setStrokeColor,
    strokeWidth,
    setStrokeWidth,
    fillColor,
    setFillColor,
    activeElementTypes,
  } = useDrawing();

  const isFillable = (type: string) => type === "Rectangle" || type === "Diamond" || type === "Circle";
  
  const showFill =
    isFillable(selectedTool) ||
    (selectedTool === "select" && activeElementTypes.some(isFillable));

  const showStroke =
    (selectedTool !== "select" && selectedTool !== "Eraser" && selectedTool !== "Image" && selectedTool !== "Hand") ||
    (selectedTool === "select" && activeElementTypes.length > 0 && activeElementTypes.some(t => t !== "Eraser" && t !== "Image" && t !== "Hand"));

  if (!showStroke && !showFill) {
    return null;
  }

  return (
    <div className="bg-background/80 backdrop-blur-md border border-border p-4 rounded-xl shadow-lg w-56 flex flex-col space-y-6">
      {/* Stroke Color Section */}
      {showStroke && (
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
      )}

      {/* Stroke Width Section */}
      {showStroke && (
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
      )}

      {/* Fill Color Section */}
      {showFill && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Fill
          </h3>
          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={() => setFillColor(null)}
              className={cn(
                "w-8 h-8 rounded-md transition-all hover:scale-110 flex items-center justify-center",
                fillColor === null
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "border border-border/50 text-muted-foreground",
              )}
              title="No fill"
              aria-label="Disable fill"
            >
              ×
            </button>

            {STROKE_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setFillColor(color)}
                className={cn(
                  "w-8 h-8 rounded-md transition-all hover:scale-110 stroke-color-swatch",
                  fillColor === color
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "border border-border/50",
                )}
                style={{ "--stroke-color": color } as CSSProperties}
                title={color}
                aria-label={`Select fill color ${color}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
