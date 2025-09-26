import { atomWithStorage } from "jotai/utils";

export type ThemeMode = "dark" | "light" | "system";

export const themeModeAtom = atomWithStorage<ThemeMode>("theme-mode", "system");
