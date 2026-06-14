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
    className: "bg-blue-100 text-blue-800",
  },
  [RequestState.POSTULATED]: {
    label: "Postulada",
    className: "bg-amber-100 text-amber-800",
  },
  [RequestState.CONFIRMED]: {
    label: "Confirmada",
    className: "bg-green-100 text-green-800",
  },
  [RequestState.REJECTED]: {
    label: "Rechazada",
    className: "bg-red-100 text-red-800",
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
