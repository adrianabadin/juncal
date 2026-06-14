"use client";

interface FieldErrorProps {
  id: string;
  message: string;
}

export default function FieldError({ id, message }: FieldErrorProps) {
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-red-600">
      {message}
    </p>
  );
}
