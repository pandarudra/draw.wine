import { CanvasBoard } from "@/components/custom/CanvasBoard";
import { Left3bar } from "@/components/custom/Left3bar";
import { Toolbar } from "@/components/custom/Toolbar";
import { DrawingProvider } from "@/contexts/DrawingContext";

export const PlayGround = () => {
  return (
    <DrawingProvider>
      <div className="h-screen w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 p-4 z-10">
          <Left3bar />
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 p-4 z-10">
          <Toolbar />
        </div>
        <CanvasBoard />
      </div>
    </DrawingProvider>
  );
};
