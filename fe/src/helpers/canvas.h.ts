import type { Element, Position } from "@/types";

export const getResizeHandles = (element: Element | null) => {
  if (!element) return [];
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
        return [
          { x: minX, y: minY, cursor: "nwse-resize", corner: "tl" },
          { x: maxX, y: minY, cursor: "nesw-resize", corner: "tr" },
          { x: maxX, y: maxY, cursor: "nwse-resize", corner: "br" },
          { x: minX, y: maxY, cursor: "nesw-resize", corner: "bl" },
        ];
      }
      break;
    }
    case "Line":
    case "Arrow": {
      if (element.width !== undefined && element.height !== undefined) {
        return [
          { x: element.x, y: element.y, cursor: "move", corner: "start" },
          {
            x: element.x + element.width,
            y: element.y + element.height,
            cursor: "move",
            corner: "end",
          },
        ];
      }
      break;
    }
    default:
      return [];
  }
  return [];
};

export const eraseElements = (
  elements: Element[],
  point: Position,
  radius: number,
) => {
  function pointToSegmentDist(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) {
      return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    }
    const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    const tClamped = Math.max(0, Math.min(1, t));
    const closestX = x1 + tClamped * dx;
    const closestY = y1 + tClamped * dy;
    return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
  }
  return elements.filter((el) => {
    if (el.type === "Pencil" && el.points) {
      return !(
        el.points &&
        el.points.some(
          (p) =>
            Math.sqrt((p.x - point.x) ** 2 + (p.y - point.y) ** 2) < radius,
        )
      );
    }
    if (
      el.type === "Rectangle" ||
      el.type === "Diamond" ||
      el.type === "Circle"
    ) {
      const minX = Math.min(el.x, el.x + (el.width || 0));
      const maxX = Math.max(el.x, el.x + (el.width || 0));
      const minY = Math.min(el.y, el.y + (el.height || 0));
      const maxY = Math.max(el.y, el.y + (el.height || 0));
      return (
        point.x < minX - radius ||
        point.x > maxX + radius ||
        point.y < minY - radius ||
        point.y > maxY + radius
      );
    }
    if (el.type === "Line" || el.type === "Arrow") {
      const x1 = el.x;
      const y1 = el.y;
      const x2 = el.x + (el.width || 0);
      const y2 = el.y + (el.height || 0);
      const dist = pointToSegmentDist(point.x, point.y, x1, y1, x2, y2);
      return dist > radius;
    }
    if (el.type === "Text" && el.text) {
      const textWidth = el.text.length * (el.fontSize || 20) * 0.6;
      const textHeight = el.fontSize || 20;
      return (
        point.x < el.x - radius ||
        point.x > el.x + textWidth + radius ||
        point.y < el.y - radius ||
        point.y > el.y + textHeight + radius
      );
    }
    return true;
  });
};
