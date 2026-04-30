import type { Element } from "@/types";

export const getCanvasElement = (): HTMLCanvasElement | null => {
  const canvas = document.querySelector("canvas") as HTMLCanvasElement;
  return canvas;
};

export const getCanvasContext = (): CanvasRenderingContext2D | null => {
  const canvas = getCanvasElement();
  return canvas?.getContext("2d") || null;
};

export const getCanvasElements = (): Element[] => {
  try {
    const saved = localStorage.getItem("drawine_canvas_element");
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Error loading elements from localStorage:", error);
    return [];
  }
};

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

export const setCanvasElements = (elements: Element[]) => {
  try {
    localStorage.setItem("drawine_canvas_element", JSON.stringify(elements));
  } catch (error) {
    console.error("Error saving elements to localStorage:", error);
  }
};
