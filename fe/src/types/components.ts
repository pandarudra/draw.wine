import type { FC } from "react";
import type { Position } from "./element";

export interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export interface IMenubtn {
  state: boolean;
  compoBefore: FC;
  compoAfter: FC;
  onClick: () => void;
}
export interface LaserPoint {
  point: Position;
  opacity: number;
  timestamp: number;
  color: string;
}
