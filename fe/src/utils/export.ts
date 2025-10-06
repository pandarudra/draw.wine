import type { Element } from "@/types";
import rough from "roughjs";

export type ExportFormat = "png" | "jpg" | "svg";

export interface ExportOptions {
  format: ExportFormat;
  quality?: number; // For JPG export (0-1)
  backgroundColor?: string;
  scale?: number; // Scale factor for export
}

/**
 * Exports the canvas as an image file
 */
export const exportCanvasAsImage = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  elements: Element[],
  position: { x: number; y: number },
  scale: number,
  options: ExportOptions = { format: "png" }
): void => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  // Create a temporary canvas for export
  const exportCanvas = document.createElement("canvas");
  const ctx = exportCanvas.getContext("2d");
  if (!ctx) return;

  // Calculate bounds of all elements to optimize export size
  const bounds = getElementsBounds(elements);
  const padding = 50; // Add some padding around the drawing

  // Set canvas size based on content bounds or minimum size
  const minWidth = 800;
  const minHeight = 600;
  const contentWidth = Math.max(bounds.width + padding * 2, minWidth);
  const contentHeight = Math.max(bounds.height + padding * 2, minHeight);

  exportCanvas.width = contentWidth * (options.scale || 1);
  exportCanvas.height = contentHeight * (options.scale || 1);

  // Set background color if specified
  if (options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  }

  // Apply scaling
  ctx.scale(options.scale || 1, options.scale || 1);

  // Translate to center content or use bounds offset
  // Use viewport position and scale to properly position elements
  const offsetX =
    bounds.width > 0
      ? -bounds.minX + padding - position.x / scale
      : contentWidth / 2;
  const offsetY =
    bounds.height > 0
      ? -bounds.minY + padding - position.y / scale
      : contentHeight / 2;
  ctx.translate(offsetX, offsetY);

  // Create rough canvas for drawing
  const rc = rough.canvas(exportCanvas);

  // Draw all elements
  elements.forEach((element) => {
    drawElementForExport(ctx, rc, element);
  });

  // Export the canvas based on format
  const filename = `drawing-${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:.]/g, "-")}`;

  if (options.format === "svg") {
    exportAsSVG(elements, bounds, filename, options);
  } else {
    const mimeType = options.format === "jpg" ? "image/jpeg" : "image/png";
    const quality =
      options.format === "jpg" ? options.quality || 0.9 : undefined;

    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          downloadBlob(blob, `${filename}.${options.format}`);
        }
      },
      mimeType,
      quality
    );
  }
};

/**
 * Saves canvas data as JSON file
 */
export const saveCanvasAsJSON = (elements: Element[]): void => {
  const data = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    elements: elements,
    metadata: {
      totalElements: elements.length,
      elementTypes: [...new Set(elements.map((el) => el.type))],
    },
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const filename = `drawing-${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:.]/g, "-")}.json`;

  downloadBlob(blob, filename);
};

/**
 * Loads canvas data from JSON file
 */
export const loadCanvasFromJSON = (): Promise<Element[]> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);

          // Validate the data structure
          if (!data.elements || !Array.isArray(data.elements)) {
            throw new Error("Invalid file format");
          }

          resolve(data.elements);
        } catch (error) {
          reject(
            new Error("Failed to parse file: " + (error as Error).message)
          );
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    };

    input.click();
  });
};

/**
 * Helper function to calculate bounds of all elements
 */
const getElementsBounds = (elements: Element[]) => {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((element) => {
    const bounds = getElementBounds(element);
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

/**
 * Helper function to get bounds of a single element
 */
const getElementBounds = (element: Element) => {
  let minX = element.x;
  let minY = element.y;
  let maxX = element.x;
  let maxY = element.y;

  if (element.width !== undefined && element.height !== undefined) {
    maxX = element.x + element.width;
    maxY = element.y + element.height;
  }

  if (element.points) {
    element.points.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
  }

  // Add text dimensions if it's a text element
  if (element.type === "Text" && element.text) {
    const fontSize = element.fontSize || 20;
    const textWidth = element.text.length * fontSize * 0.6; // Rough estimation
    maxX = Math.max(maxX, element.x + textWidth);
    maxY = Math.max(maxY, element.y + fontSize);
  }

  return { minX, minY, maxX, maxY };
};

/**
 * Helper function to draw an element for export
 */
const drawElementForExport = (
  ctx: CanvasRenderingContext2D,
  rc: any,
  element: Element
) => {
  const options = {
    stroke: element.strokeColor,
    strokeWidth: element.strokeWidth,
    roughness: element.roughness || 1,
    seed: element.seed || 1,
  };

  switch (element.type) {
    case "Rectangle":
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

    case "Diamond":
      if (element.width && element.height) {
        const points: [number, number][] = [
          [element.x + element.width / 2, element.y],
          [element.x + element.width, element.y + element.height / 2],
          [element.x + element.width / 2, element.y + element.height],
          [element.x, element.y + element.height / 2],
        ];
        rc.polygon(points, options);
      }
      break;

    case "Circle":
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

    case "Line":
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

    case "Arrow":
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

    case "Pencil":
      if (element.points && element.points.length > 0) {
        ctx.save();
        ctx.strokeStyle = element.strokeColor;
        ctx.lineWidth = element.strokeWidth;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        if (element.points.length === 1) {
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
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          ctx.lineTo(element.points[1].x, element.points[1].y);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);

          for (let i = 1; i < element.points.length - 1; i++) {
            const currentPoint = element.points[i];
            const nextPoint = element.points[i + 1];
            const cpx = (currentPoint.x + nextPoint.x) / 2;
            const cpy = (currentPoint.y + nextPoint.y) / 2;
            ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, cpx, cpy);
          }

          const lastPoint = element.points[element.points.length - 1];
          ctx.lineTo(lastPoint.x, lastPoint.y);
          ctx.stroke();
        }

        ctx.restore();
      }
      break;

    case "Text":
      if (element.text) {
        ctx.save();
        ctx.font = `${element.fontSize || 20}px ${
          element.fontFamily || "Virgil"
        }`;
        ctx.fillStyle = element.strokeColor || "#000";
        ctx.textBaseline = "top";
        ctx.fillText(element.text, element.x, element.y);
        ctx.restore();
      }
      break;

    case "Image":
      // Note: Image export would require additional handling for image elements
      // This would need the actual image data to be stored or accessible
      break;
  }
};

/**
 * Export as SVG format
 */
const exportAsSVG = (
  elements: Element[],
  bounds: any,
  filename: string,
  options: ExportOptions
) => {
  const padding = 50;
  const width = Math.max(bounds.width + padding * 2, 800);
  const height = Math.max(bounds.height + padding * 2, 600);

  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

  if (options.backgroundColor) {
    svgContent += `<rect width="100%" height="100%" fill="${options.backgroundColor}"/>`;
  }

  const offsetX = bounds.width > 0 ? -bounds.minX + padding : width / 2;
  const offsetY = bounds.height > 0 ? -bounds.minY + padding : height / 2;

  elements.forEach((element) => {
    svgContent += elementToSVG(element, offsetX, offsetY);
  });

  svgContent += "</svg>";

  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  downloadBlob(blob, `${filename}.svg`);
};

/**
 * Convert element to SVG string
 */
const elementToSVG = (
  element: Element,
  offsetX: number,
  offsetY: number
): string => {
  const x = element.x + offsetX;
  const y = element.y + offsetY;
  const stroke = element.strokeColor;
  const strokeWidth = element.strokeWidth;

  switch (element.type) {
    case "Rectangle":
      if (element.width && element.height) {
        return `<rect x="${x}" y="${y}" width="${element.width}" height="${element.height}" 
                fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
      }
      break;

    case "Circle":
      if (element.width && element.height) {
        const cx = x + element.width / 2;
        const cy = y + element.height / 2;
        const rx = Math.abs(element.width) / 2;
        const ry = Math.abs(element.height) / 2;
        return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" 
                fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
      }
      break;

    case "Line":
      if (element.width !== undefined && element.height !== undefined) {
        const x2 = x + element.width;
        const y2 = y + element.height;
        return `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" 
                stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
      }
      break;

    case "Text":
      if (element.text) {
        const fontSize = element.fontSize || 20;
        const fontFamily = element.fontFamily || "Virgil";
        return `<text x="${x}" y="${y}" font-family="${fontFamily}" font-size="${fontSize}" 
                fill="${stroke}">${element.text}</text>`;
      }
      break;

    case "Pencil":
      if (element.points && element.points.length > 1) {
        let pathData = `M ${element.points[0].x + offsetX} ${
          element.points[0].y + offsetY
        }`;
        for (let i = 1; i < element.points.length; i++) {
          pathData += ` L ${element.points[i].x + offsetX} ${
            element.points[i].y + offsetY
          }`;
        }
        return `<path d="${pathData}" fill="none" stroke="${stroke}" 
                stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
      break;
  }

  return "";
};

/**
 * Helper function to download a blob as a file
 */
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
