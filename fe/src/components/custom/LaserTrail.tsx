import { useEffect, useRef, useState } from "react";
import type { Position } from "@/types";

interface LaserPoint {
  point: Position;
  opacity: number;
  timestamp: number;
  color: string;
}

const NEON_RED = "#ff0000"; // Bright red

export function useLaserTrail() {
  const [trail, setTrail] = useState<LaserPoint[]>([]);
  const animationFrame = useRef<number | null>(null);
  const lastPoint = useRef<Position | null>(null);

  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      setTrail((prevTrail) =>
        prevTrail
          .map((point) => ({
            ...point,
            opacity: Math.max(0, 1 - (now - point.timestamp) / 3000), // Fade over 3 seconds
          }))
          .filter((point) => point.opacity > 0)
      );

      // Always keep animation frame running
      animationFrame.current = requestAnimationFrame(animate);
    };

    // Start animation immediately
    if (!animationFrame.current) {
      animationFrame.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
    };
  }, [trail]);

  const addPoint = (point: Position) => {
    const now = Date.now();

    setTrail((prev) => {
      // Keep points from last 2 seconds
      const recentPoints = prev.filter((p) => now - p.timestamp < 2000);

      // Add the new point
      return [
        ...recentPoints,
        {
          point,
          opacity: 1,
          timestamp: now,
          color: NEON_RED,
        },
      ];
    });

    lastPoint.current = point;
  };

  const clearTrail = () => {
    setTrail([]);
    lastPoint.current = null;
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  };

  // Generate smooth SVG path using Catmull-Rom spline
  const getSmoothPath = () => {
    if (trail.length < 2) return "";

    const points = trail.map((t) => t.point);

    // For Catmull-Rom spline, we need at least 4 points
    // Duplicate first and last points for better behavior
    const allPoints = [points[0], ...points, points[points.length - 1]];

    let path = `M ${allPoints[1].x} ${allPoints[1].y}`;

    for (let i = 1; i < allPoints.length - 2; i++) {
      const p0 = allPoints[i - 1];
      const p1 = allPoints[i];
      const p2 = allPoints[i + 1];
      const p3 = allPoints[i + 2];

      // Catmull-Rom to Bezier conversion
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  return {
    trail,
    addPoint,
    clearTrail,
    getSmoothPath,
  };
}
