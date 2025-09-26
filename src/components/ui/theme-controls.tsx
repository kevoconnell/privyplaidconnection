"use client";

import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";

import { themeModeAtom, type ThemeMode } from "@/store/common/atoms";

const MODE_SEQUENCE: ThemeMode[] = ["dark", "light", "system"];

const THEMES = ["dark", "light"] as const;
type Theme = (typeof THEMES)[number];

function getSystemTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeControls() {
  const [mode, setMode] = useAtom(themeModeAtom);

  useEffect(() => {
    const nextTheme: Theme = mode === "system" ? getSystemTheme() : mode;
    applyTheme(nextTheme);
  }, [mode]);

  useEffect(() => {
    if (mode !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (event: MediaQueryListEvent) => {
      const nextTheme: Theme = event.matches ? "dark" : "light";
      applyTheme(nextTheme);
    };

    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
    } else {
      media.addListener(handleChange);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handleChange);
      } else {
        media.removeListener(handleChange);
      }
    };
  }, [mode]);

  const handleCycle = () => {
    const currentIndex = MODE_SEQUENCE.indexOf(mode);
    const nextMode = MODE_SEQUENCE[(currentIndex + 1) % MODE_SEQUENCE.length];
    setMode(nextMode);
  };

  const iconByMode: Record<ThemeMode, React.JSX.Element> = {
    dark: <MoonIcon className="h-5 w-5" />,
    light: <SunIcon className="h-5 w-5" />,
    system: <ComputerDesktopIcon className="h-5 w-5" />,
  };

  const labelByMode: Record<ThemeMode, string> = {
    dark: "Dark mode",
    light: "Light mode",
    system: "System mode",
  };

  const currentLabel = labelByMode[mode];
  const nextMode =
    MODE_SEQUENCE[(MODE_SEQUENCE.indexOf(mode) + 1) % MODE_SEQUENCE.length];
  const nextLabel = labelByMode[nextMode];

  return (
    <button
      type="button"
      onClick={handleCycle}
      className="inline-flex h-12 w-12 items-center justify-center rounded-full border text-[var(--foreground)] transition hover:scale-105 hover:shadow-lg"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
      }}
      aria-label={`Cycle theme (current: ${currentLabel})`}
      title={`Switch to ${nextLabel}`}
    >
      {iconByMode[mode]}
      <span className="sr-only">{currentLabel}</span>
    </button>
  );
}
