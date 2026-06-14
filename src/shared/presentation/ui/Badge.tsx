"use client";

import { RequestState } from "@shift-replacements/domain/enums/RequestState";

interface BadgeProps {
  state: RequestState;
}

const stateConfig: Record<
  RequestState,
  { label: string; className: string }
> = {
  [RequestState.OPEN]: {
    label: "Abierta",
    className: "bg-brand-100 text-brand-800 ring-1 ring-brand-200",
  },
  [RequestState.POSTULATED]: {
    label: "Postulada",
    className: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  },
  [RequestState.CONFIRMED]: {
    label: "Confirmada",
    className: "bg-sage-100 text-sage-800 ring-1 ring-sage-300",
  },
  [RequestState.REJECTED]: {
    label: "Rechazada",
    className: "bg-red-100 text-red-800 ring-1 ring-red-200",
  },
};

export default function Badge({ state }: BadgeProps) {
  const { label, className } = stateConfig[state];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
