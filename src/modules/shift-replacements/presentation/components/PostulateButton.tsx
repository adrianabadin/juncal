"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postulateAction } from "@shift-replacements/presentation/actions/shiftActions";
import Button from "@shared/presentation/ui/Button";

interface PostulateButtonProps {
  shiftId: string;
}

export default function PostulateButton({ shiftId }: PostulateButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePostulate() {
    setIsLoading(true);
    setError(null);
    const result = await postulateAction({ shiftId });
    setIsLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant="secondary" isLoading={isLoading} onClick={handlePostulate}>
        Postularme
      </Button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
