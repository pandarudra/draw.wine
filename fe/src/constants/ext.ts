import React from "react";
import { Minus } from "lucide-react";

export const NEON_RED = "#ff0000"; // Bright red

export const STROKE_COLORS = [
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

export const STROKE_WIDTHS = [
  {
    value: 1,
    icon: React.createElement(Minus, { className: "h-4 w-4 stroke-[1]" }),
  },
  {
    value: 3,
    icon: React.createElement(Minus, { className: "h-5 w-5 stroke-[3]" }),
  },
  {
    value: 5,
    icon: React.createElement(Minus, { className: "h-6 w-6 stroke-[5]" }),
  },
];
