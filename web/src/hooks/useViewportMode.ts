import { useEffect, useState } from "react";

type ViewportMode = "mobile" | "tablet" | "desktop";

function resolveMode(width: number): ViewportMode {
  if (width >= 1024) {
    return "desktop";
  }
  if (width >= 768) {
    return "tablet";
  }
  return "mobile";
}

export function useViewportMode() {
  const [mode, setMode] = useState<ViewportMode>(() => {
    if (typeof window === "undefined") {
      return "mobile";
    }
    return resolveMode(window.innerWidth);
  });

  useEffect(() => {
    const update = () => setMode(resolveMode(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return mode;
}
