"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveReplacementAction } from "@shift-replacements/presentation/actions/shiftActions";
import Button from "@shared/presentation/ui/Button";

type ResolveAction = "CONFIRM" | "REJECT_POSTULATION" | "REJECT_REQUEST";

interface ResolveActionsProps {
  shiftId: string;
}

export default function ResolveActions({ shiftId }: ResolveActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<ResolveAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: ResolveAction) {
    setLoading(action);
    setError(null);
    const result = await resolveReplacementAction({ shiftId, action });
    setLoading(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          isLoading={loading === "CONFIRM"}
          disabled={loading !== null}
          onClick={() => handleAction("CONFIRM")}
        >
          Confirmar
        </Button>
        <Button
          variant="secondary"
          isLoading={loading === "REJECT_POSTULATION"}
          disabled={loading !== null}
          onClick={() => handleAction("REJECT_POSTULATION")}
        >
          Rechazar postulación
        </Button>
        <Button
          variant="danger"
          isLoading={loading === "REJECT_REQUEST"}
          disabled={loading !== null}
          onClick={() => handleAction("REJECT_REQUEST")}
        >
          Rechazar solicitud
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
