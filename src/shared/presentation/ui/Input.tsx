"use client";

import { InputHTMLAttributes } from "react";
import FieldError from "./FieldError";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

export default function Input({
  label,
  id,
  error,
  className = "",
  ...rest
}: InputProps) {
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={[
          "w-full rounded-md border px-3 py-2 text-base text-slate-900 transition-colors",
          "min-h-11",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600",
          error
            ? "border-red-500 focus-visible:ring-red-500"
            : "border-slate-300 focus-visible:ring-blue-600",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
      {error && <FieldError id={errorId} message={error} />}
    </div>
  );
}
