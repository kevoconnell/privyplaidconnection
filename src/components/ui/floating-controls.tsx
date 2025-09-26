"use client";

import { FaGithub } from "react-icons/fa";

import { ThemeControls } from "./theme-controls";

export function FloatingControls() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      <a
        href="https://github.com/kevoconnell/privyplaidconnection"
        target="_blank"
        rel="noopener noreferrer"
        className="control-pill"
        aria-label="Open GitHub repository"
      >
        <FaGithub className="h-5 w-5" />
      </a>
      <ThemeControls />
    </div>
  );
}
