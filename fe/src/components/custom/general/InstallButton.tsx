import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download } from "lucide-react";

export const InstallButton = () => {
  const { canInstall, install } = usePWAInstall();
  if (!canInstall) return null;
  return (
    <Button onClick={install} size="icon" disabled={!canInstall}>
      <Download className="h-4 w-4" />
    </Button>
  );
};
