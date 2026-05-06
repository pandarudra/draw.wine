import { BiPointer, BiSolidPointer } from "react-icons/bi";
import {
  TbRectangle,
  TbRectangleFilled,
  TbSquareRotated,
  TbSquareRotatedFilled,
} from "react-icons/tb";
import { FaRegCircle, FaCircle, FaArrowRightLong } from "react-icons/fa6";
import { MdOutlineHorizontalRule, MdFormatColorText } from "react-icons/md";
import { LuPencil, LuHand } from "react-icons/lu";
import { CiImageOn, CiEraser } from "react-icons/ci";
import { ImMagicWand } from "react-icons/im";

export const TOOLBAR_ITEMS = [
  { before: LuHand, after: LuHand, tooltip: "Hand" },
  { before: BiPointer, after: BiSolidPointer, tooltip: "select" },
  { before: TbRectangle, after: TbRectangleFilled, tooltip: "Rectangle" },
  { before: TbSquareRotated, after: TbSquareRotatedFilled, tooltip: "Diamond" },
  { before: FaRegCircle, after: FaCircle, tooltip: "Circle" },
  { before: FaArrowRightLong, after: FaArrowRightLong, tooltip: "Arrow" },
  {
    before: MdOutlineHorizontalRule,
    after: MdOutlineHorizontalRule,
    tooltip: "Line",
  },
  { before: LuPencil, after: LuPencil, tooltip: "Pencil" },
  { before: MdFormatColorText, after: MdFormatColorText, tooltip: "Text" },
  { before: CiImageOn, after: CiImageOn, tooltip: "Image" },
  { before: CiEraser, after: CiEraser, tooltip: "Eraser" },
  { before: ImMagicWand, after: ImMagicWand, tooltip: "Laser" },
];
