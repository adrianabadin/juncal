"use client";

import { useState } from "react";
import Modal from "@shared/presentation/ui/Modal";
import AssignCompulsoryForm from "@shift-replacements/presentation/components/AssignCompulsoryForm";
import Button from "@shared/presentation/ui/Button";

interface SpecialtyOption {
  id: string;
  name: string;
}

interface ShiftOption {
  id: string;
  date: string;
  specialtyId: string;
  requesterStart: string;
  requesterEnd: string;
}

interface AbsenceReasonOption {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
}

interface AssignCompulsoryButtonProps {
  specialties: SpecialtyOption[];
  openShifts: ShiftOption[];
  reasons: AbsenceReasonOption[];
}

export default function AssignCompulsoryButton({ specialties, openShifts, reasons }: AssignCompulsoryButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Asignar cobertura compulsiva</Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Asignar cobertura compulsiva">
        <AssignCompulsoryForm specialties={specialties} openShifts={openShifts} reasons={reasons} />
      </Modal>
    </>
  );
}
