"use client";

import { useCallback, useState } from "react";

interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error";
}

let toastId = 0;
const listeners: Array<(msg: ToastMessage) => void> = [];

export function toast(message: string, type: "success" | "error" = "success") {
  const msg: ToastMessage = { id: ++toastId, message, type };
  listeners.forEach((fn) => fn(msg));
}

export function useToast() {
  const [, setMessages] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error" = "success") => {
    toast(message, type);
  }, []);

  return { toast: addToast };
}
