import { TOOLBAR_ITEMS } from "@/constants/toolbar";
import { Menubar } from "../../ui/menubar";
import { CMenubtn } from "./menubtn";
import { memo, useCallback, useEffect, useState } from "react";
import { useDrawing } from "@/contexts/DrawingContext";
import type { ToolType } from "@/types/drawing";

export const Toolbar = memo(() => {
  const { selectedTool, setSelectedTool } = useDrawing();
  const [selected, setSelected] = useState<number | null>(0);

  const handleSelect = useCallback(
    (index: number) => {
      // setSelected((prev) => (prev === index ? null : index));
      const toolType = TOOLBAR_ITEMS[index]?.tooltip || "select";
      setSelectedTool(toolType as ToolType);
    },
    [setSelectedTool],
  );

  useEffect(() => {
    const index = TOOLBAR_ITEMS.findIndex(
      (item) => item.tooltip === selectedTool,
    );
    setSelected(index);
  }, [selectedTool]);

  return (
    <Menubar className="w-full border-b h-12">
      {TOOLBAR_ITEMS.map((item, index) => (
        <CMenubtn
          key={index}
          state={selected === index}
          compoBefore={item.before}
          compoAfter={item.after}
          onClick={() => handleSelect(index)}
        />
      ))}
    </Menubar>
  );
});
