"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postulateAction } from "@shift-replacements/presentation/actions/shiftActions";
import Button from "@shared/presentation/ui/Button";

interface PostulateButtonProps {
  shiftId: string;
  shiftStart: string;
  shiftEnd: string;
}

export default function PostulateButton({
  shiftId,
  shiftStart,
  shiftEnd,
}: PostulateButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [start, setStart] = useState(shiftStart.slice(0, 16));
  const [end, setEnd] = useState(shiftEnd.slice(0, 16));

  async function handlePostulate() {
    setIsLoading(true);
    setError(null);
    const result = await postulateAction({
      shiftId,
      start,
      end,
    });
    setIsLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (!showForm) {
    return (
      <Button
        variant="secondary"
        onClick={() => setShowForm(true)}
      >
        Postularme
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-brand-100 bg-brand-50 p-3">
      <p className="text-xs font-medium text-brand-700">
        Elegí el tramo que podés cubrir:
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`start-${shiftId}`} className="text-xs text-muted-foreground">
            Entrada
          </label>
          <input
            id={`start-${shiftId}`}
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`end-${shiftId}`} className="text-xs text-muted-foreground">
            Salida
          </label>
          <input
            id={`end-${shiftId}`}
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button isLoading={isLoading} onClick={handlePostulate}>
          Confirmar postulación
        </Button>
        <Button variant="secondary" onClick={() => setShowForm(false)}>
          Cancelar
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
