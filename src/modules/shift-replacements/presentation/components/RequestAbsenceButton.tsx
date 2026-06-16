"use client";

import { useState } from "react";
import Modal from "@shared/presentation/ui/Modal";
import RequestAbsenceForm from "@shift-replacements/presentation/components/RequestAbsenceForm";
import Button from "@shared/presentation/ui/Button";

interface SpecialtyOption {
  id: string;
  name: string;
}

interface RequestAbsenceButtonProps {
  specialties: SpecialtyOption[];
}

export default function RequestAbsenceButton({ specialties }: RequestAbsenceButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Solicitar ausencia</Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Solicitar ausencia">
        <RequestAbsenceForm specialties={specialties} />
      </Modal>
    </>
  );
}
