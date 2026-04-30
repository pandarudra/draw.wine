import { STORAGE_KEY } from "@/constants/canvas";
import type { Element } from "@/types";

export const saveToLocalStorage = (elements: Element[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(elements));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};

export const loadFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return [];
  }
};
