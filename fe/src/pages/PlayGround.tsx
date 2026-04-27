import { CanvasBoard } from "@/components/custom/CanvasBoard";
import { Left3bar } from "@/components/custom/Left3bar";
import { Toolbar } from "@/components/custom/Toolbar";
import { DrawingProvider } from "@/contexts/DrawingContext";
import { ThemeToggle } from "@/components/custom/ThemeToggle";
import { PropertiesPanel } from "@/components/custom/PropertiesPanel";

export const PlayGround = () => {
  return (
    <DrawingProvider>
      <div className="h-screen w-full relative overflow-hidden bg-background text-foreground">
        <div className="absolute top-0 left-0 p-4 z-10">
          <Left3bar />
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 p-4 z-10">
          <Toolbar />
        </div>
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        {/* Properties Panel (Left Sidebar below Left3bar) */}
        <div className="absolute top-[88px] left-4 z-10">
          <PropertiesPanel />
        </div>
        <CanvasBoard />
      </div>
    </DrawingProvider>
  );
};
