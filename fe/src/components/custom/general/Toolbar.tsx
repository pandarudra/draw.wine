import { TOOLBAR_ITEMS } from "@/constants/toolbar";
import { Menubar } from "../../ui/menubar";
import { CMenubtn } from "./menubtn";
import { memo, useCallback, useEffect, useState } from "react";
import { useDrawing } from "@/contexts/DrawingContext";
import type { ToolType } from "@/types/drawing";
import { useCollab } from "@/contexts/CollabContext";

export const Toolbar = memo(() => {
  const { selectedTool, setSelectedTool } = useDrawing();
  const { state } = useCollab();
  const [selected, setSelected] = useState<number | null>(0);

  const canDraw = !state.settings?.onlyHostCanDraw || state.userId === state.hostId || !state.isCollaborating;

  const visibleItems = TOOLBAR_ITEMS.filter((item) => {
    if (canDraw) return true;
    return ["Hand", "select", "Laser"].includes(item.tooltip);
  });

  const handleSelect = useCallback(
    (item: typeof TOOLBAR_ITEMS[0]) => {
      setSelectedTool(item.tooltip as ToolType);
    },
    [setSelectedTool],
  );

  useEffect(() => {
    const index = visibleItems.findIndex(
      (item) => item.tooltip === selectedTool,
    );
    setSelected(index);
    
    // Auto-switch to Hand tool if current tool is not allowed
    if (index === -1 && !canDraw) {
      setSelectedTool("Hand");
    }
  }, [selectedTool, visibleItems, canDraw, setSelectedTool]);

  return (
    <Menubar className="w-full border-b h-12">
      {visibleItems.map((item, index) => (
        <CMenubtn
          key={item.tooltip}
          state={selected === index}
          compoBefore={item.before}
          compoAfter={item.after}
          onClick={() => handleSelect(item)}
        />
      ))}
    </Menubar>
  );
});
