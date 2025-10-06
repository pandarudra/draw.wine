import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { Checkbox } from "../../ui/checkbox";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import type { ExportFormat, ExportOptions } from "@/utils/export";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
}

export const ExportModal = ({
  isOpen,
  onClose,
  onExport,
}: ExportModalProps) => {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState(90);
  const [backgroundColor, setBackgroundColor] = useState("");
  const [useBackgroundColor, setUseBackgroundColor] = useState(false);
  const [scale, setScale] = useState(1);

  const handleExport = () => {
    const options: ExportOptions = {
      format,
      quality: format === "jpg" ? quality / 100 : undefined,
      backgroundColor: useBackgroundColor
        ? backgroundColor || "#ffffff"
        : undefined,
      scale,
    };

    onExport(options);
    onClose();
  };

  const resetToDefaults = () => {
    setFormat("png");
    setQuality(90);
    setBackgroundColor("");
    setUseBackgroundColor(false);
    setScale(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Drawing</DialogTitle>
          <DialogDescription>
            Choose your export format and settings. Your drawing will be
            downloaded to your computer.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="png" id="png" />
                <Label htmlFor="png">PNG</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="jpg" id="jpg" />
                <Label htmlFor="jpg">JPG</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="svg" id="svg" />
                <Label htmlFor="svg">SVG</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Quality Setting for JPG */}
          {format === "jpg" && (
            <div className="space-y-2">
              <Label htmlFor="quality">Quality: {quality}%</Label>
              <Input
                id="quality"
                type="range"
                min="10"
                max="100"
                step="5"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* Scale Selection */}
          <div className="space-y-2">
            <Label htmlFor="scale">Scale</Label>
            <Select
              value={scale.toString()}
              onValueChange={(value) => setScale(Number(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">0.5x (Half size)</SelectItem>
                <SelectItem value="1">1x (Original size)</SelectItem>
                <SelectItem value="1.5">1.5x</SelectItem>
                <SelectItem value="2">2x (Double size)</SelectItem>
                <SelectItem value="3">3x (Triple size)</SelectItem>
                <SelectItem value="4">4x (Quadruple size)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Background Color */}
          {format !== "svg" && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-background"
                  checked={useBackgroundColor}
                  onCheckedChange={(checked) =>
                    setUseBackgroundColor(checked as boolean)
                  }
                />
                <Label htmlFor="use-background">Add background color</Label>
              </div>

              {useBackgroundColor && (
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={backgroundColor || "#ffffff"}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-12 h-8 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={backgroundColor || "#ffffff"}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              )}
            </div>
          )}

          {/* Format Information */}
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="font-medium mb-1">Format Information:</div>
            {format === "png" && (
              <div>
                PNG: Best for drawings with transparency. Lossless compression.
              </div>
            )}
            {format === "jpg" && (
              <div>
                JPG: Smaller file size, good for sharing. No transparency
                support.
              </div>
            )}
            {format === "svg" && (
              <div>
                SVG: Vector format, infinitely scalable. Perfect for simple
                shapes.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetToDefaults}>
            Reset
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport}>Export Drawing</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
