import { useEffect } from "react";

export interface KeyboardShortcuts {
  onSave?: () => void;
  onExport?: () => void;
  onImport?: () => void;
}

export const useKeyboardShortcuts = ({
  onSave,
  onExport,
  onImport,
}: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Ctrl (or Cmd on Mac) is pressed
      const isCtrlPressed = event.ctrlKey || event.metaKey;

      if (!isCtrlPressed) return;

      // Prevent default browser behavior for our shortcuts
      switch (event.key.toLowerCase()) {
        case "s":
          if (onSave) {
            event.preventDefault();
            onSave();
          }
          break;
        case "e":
          if (event.shiftKey && onExport) {
            event.preventDefault();
            onExport();
          }
          break;
        case "o":
          if (onImport) {
            event.preventDefault();
            onImport();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSave, onExport, onImport]);
};
