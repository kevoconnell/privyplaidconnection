import type { ReactNode } from "react";

import { GlassCard } from "./glass-card";

interface StepAction {
  label: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
}

interface StepCardProps {
  stepLabel: string;
  stepSubtitle: string;
  headline: ReactNode;
  body: ReactNode;
  supplementalNote?: ReactNode;
  primaryAction?: StepAction;
  secondaryAction?: StepAction;
}

export function StepCard({
  stepLabel,
  stepSubtitle,
  headline,
  body,
  supplementalNote,
  primaryAction,
  secondaryAction,
}: StepCardProps) {
  return (
    <GlassCard className="flex h-full  flex-1 flex-col gap-4 p-5 text-left text-secondary lg:col-span-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="tag">{stepLabel}</span>
        <span className="text-sm text-secondary">{stepSubtitle}</span>
      </div>

      <div className="space-y-3">
        <h2 className="text-4xl font-semibold leading-snug text-primary md:text-5xl">
          {headline}
        </h2>
        <div className="max-w-xl text-base leading-7 text-secondary">
          {body}
        </div>
        {supplementalNote ? (
          <div className="text-sm text-secondary">{supplementalNote}</div>
        ) : null}
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
          {primaryAction ? (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="button-primary"
              disabled={primaryAction.disabled}
            >
              {primaryAction.label}
            </button>
          ) : null}

          {secondaryAction ? (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="button-secondary"
              disabled={secondaryAction.disabled}
            >
              {secondaryAction.label}
            </button>
          ) : null}
        </div>
      )}
    </GlassCard>
  );
}
