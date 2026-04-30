import { useState } from "react";
import type { ExportFormat, ExportOptions } from "@/helpers/export.h";

interface UseExportModalOptions {
  onExport: (options: ExportOptions) => void;
  onClose: () => void;
}

export const useExportModal = ({
  onExport,
  onClose,
}: UseExportModalOptions) => {
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

  return {
    format,
    setFormat,
    quality,
    setQuality,
    backgroundColor,
    setBackgroundColor,
    useBackgroundColor,
    setUseBackgroundColor,
    scale,
    setScale,
    handleExport,
    resetToDefaults,
  };
};
