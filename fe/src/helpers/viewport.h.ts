import type { Element, Position } from "@/types";

export const isElementInViewport = (
  element: Element,
  canvasWidth: number,
  canvasHeight: number,
  position: Position,
  scale: number,
  padding: number = 100,
): boolean => {
  if (!element.width || !element.height) return false;

  const viewportBounds = {
    left: -position.x / scale,
    top: -position.y / scale,
    right: (-position.x + canvasWidth) / scale,
    bottom: (-position.y + canvasHeight) / scale,
  };

  const scaledPadding = padding / scale;
  const elementBounds = {
    left: element.x - scaledPadding,
    top: element.y - scaledPadding,
    right: element.x + element.width + scaledPadding,
    bottom: element.y + element.height + scaledPadding,
  };

  const isVisible = !(
    elementBounds.right < viewportBounds.left ||
    elementBounds.left > viewportBounds.right ||
    elementBounds.bottom < viewportBounds.top ||
    elementBounds.top > viewportBounds.bottom
  );

  return isVisible;
};
