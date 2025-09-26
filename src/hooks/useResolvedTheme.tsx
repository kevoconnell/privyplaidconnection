import { ThemeMode, themeModeAtom } from "@/store/common";
import { getSystemTheme, ResolvedTheme } from "@/utils/theme";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

export function useResolvedTheme(): ResolvedTheme {
  const mode = useAtomValue(themeModeAtom);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  useEffect(() => {
    if (mode !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    setSystemTheme(media.matches ? "dark" : "light");
  }, [mode]);

  const resolvedTheme: ResolvedTheme =
    mode === "system" ? systemTheme : (mode as Exclude<ThemeMode, "system">);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  return resolvedTheme;
}
