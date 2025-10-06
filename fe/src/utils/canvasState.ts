import type { Element } from "@/types";

/**
 * Gets the current canvas element from DOM
 */
export const getCanvasElement = (): HTMLCanvasElement | null => {
  // Look for the canvas element in the CanvasBoard component
  const canvas = document.querySelector("canvas") as HTMLCanvasElement;
  return canvas;
};

/**
 * Gets the canvas context from DOM
 */
export const getCanvasContext = (): CanvasRenderingContext2D | null => {
  const canvas = getCanvasElement();
  return canvas?.getContext("2d") || null;
};

/**
 * Gets canvas elements from localStorage
 */
export const getCanvasElements = (): Element[] => {
  try {
    const saved = localStorage.getItem("drawine_canvas_element");
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Error loading elements from localStorage:", error);
    return [];
  }
};

/**
 * Gets the current viewport state (position and scale) from localStorage
 */
export const getCanvasViewport = () => {
  try {
    const viewportData = localStorage.getItem("drawine_canvas_viewport");
    if (viewportData) {
      return JSON.parse(viewportData);
    }
  } catch (error) {
    console.error("Error loading viewport from localStorage:", error);
  }
  return { position: { x: 0, y: 0 }, scale: 1 };
};

/**
 * Sets canvas elements in localStorage
 */
export const setCanvasElements = (elements: Element[]) => {
  try {
    localStorage.setItem("drawine_canvas_element", JSON.stringify(elements));
  } catch (error) {
    console.error("Error saving elements to localStorage:", error);
  }
};
