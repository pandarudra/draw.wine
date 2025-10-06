import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { LoadingFallback } from "./components/custom/fallbacks/LoadingFallback";
import WebFont from "webfontloader";
import { CollabProvider } from "./contexts/CollabContext";
import CollabRoom from "./pages/CollabRoom";
import { Toaster } from "./components/ui/sonner";
import { MobileScreenFallback } from "./components/custom/fallbacks/MobileScreenFallback";

const Landing = lazy(() =>
  import("./pages/Landing").then((module) => ({
    default: module.Landing,
  }))
);

const PlayGround = lazy(() =>
  import("./pages/PlayGround").then((module) => ({
    default: module.PlayGround,
  }))
);

export const App = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // check if mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Check on mount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Load custom fonts
  useEffect(() => {
    // Load fonts
    WebFont.load({
      custom: {
        families: ["Virgil"],
        urls: ["/fonts/Virgil.woff2"],
      },
      active: () => {
        // Font has loaded
        document.documentElement.classList.add("fonts-loaded");
      },
    });
  }, []);

  if (isMobile) {
    return <MobileScreenFallback />;
  }

  return (
    <BrowserRouter>
      <CollabProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/board/:id" element={<PlayGround />} />
            <Route path="/collab" element={<CollabRoom />} />
          </Routes>
        </Suspense>
        <Toaster />
      </CollabProvider>
    </BrowserRouter>
  );
};
