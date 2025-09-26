"use client";

import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { useAtom } from "jotai";

import { themeModeAtom, type ThemeMode } from "@/store/common/atoms";

const MODE_SEQUENCE: ThemeMode[] = ["dark", "light", "system"];

export function ThemeControls() {
  const [mode, setMode] = useAtom(themeModeAtom);

  const handleThemeCycle = () => {
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
      onClick={handleThemeCycle}
      className="control-pill"
      aria-label={`Cycle theme (current: ${currentLabel})`}
      title={`Switch to ${nextLabel}`}
    >
      {iconByMode[mode]}
      <span className="sr-only">{currentLabel}</span>
    </button>
  );
}
