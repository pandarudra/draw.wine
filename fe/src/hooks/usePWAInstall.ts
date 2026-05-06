import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const globalListeners = new Set<
  (promptEvent: BeforeInstallPromptEvent | null) => void
>();

let isListenerInitialized = false;

const notifyGlobalListeners = () => {
  for (const listener of globalListeners) {
    listener(globalDeferredPrompt);
  }
};

export const initPWAInstall = () => {
  if (isListenerInitialized) return;
  if (typeof window === "undefined") return;

  isListenerInitialized = true;

  const beforeInstallPromptHandler = (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    notifyGlobalListeners();
  };

  const appInstalledHandler = () => {
    globalDeferredPrompt = null;
    notifyGlobalListeners();
  };

  window.addEventListener("beforeinstallprompt", beforeInstallPromptHandler);
  window.addEventListener("appinstalled", appInstalledHandler);
};

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(() => globalDeferredPrompt);

  useEffect(() => {
    initPWAInstall();

    const listener = (promptEvent: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(promptEvent);
    };

    globalListeners.add(listener);
    // In case the prompt was captured before this hook mounted
    setDeferredPrompt(globalDeferredPrompt);

    return () => {
      globalListeners.delete(listener);
    };
  }, []);

  const install = async () => {
    if (!globalDeferredPrompt) return;

    await globalDeferredPrompt.prompt();

    const choice = await globalDeferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      console.log("Installed 🎉");
    }

    globalDeferredPrompt = null;
    notifyGlobalListeners();
  };

  return {
    canInstall: !!deferredPrompt,
    install,
  };
};
