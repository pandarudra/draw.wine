import React from "react";
import { Minus } from "lucide-react";

export const NEON_RED = "#ff0000"; // Bright red

export const STROKE_COLORS = [
  "#495057", // Soft Black / Dark Gray
  "#ff8787", // Pastel Red
  "#8ce99a", // Pastel Green
  "#74c0fc", // Pastel Blue
  "#ffd43b", // Pastel Yellow/Orange
  "#e599f7", // Pastel Grape
  "#63e6be", // Pastel Teal
  "#ced4da", // Soft Gray
  "#ffa94d", // Pastel Burnt Orange
  "#66d9e8", // Pastel Cyan
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
