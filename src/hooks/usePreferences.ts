import { useEffect, useState } from "react";
import { loadPreferences, type ReaderPreferences } from "@/lib/preferences";

export function usePreferences(): ReaderPreferences {
  const [prefs, setPrefs] = useState<ReaderPreferences>(loadPreferences);
  useEffect(() => {
    const update = () => setPrefs(loadPreferences());
    window.addEventListener("malani:preferences", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("malani:preferences", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return prefs;
}
