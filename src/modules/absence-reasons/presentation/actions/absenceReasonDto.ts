import { AbsenceReason } from "@absence-reasons/domain/entities/AbsenceReason";

export interface AbsenceReasonDto {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
}

export function toAbsenceReasonDto(reason: AbsenceReason): AbsenceReasonDto {
  return {
    id: reason.id,
    name: reason.name,
    isDefault: reason.isDefault,
    isActive: reason.isActive,
  };
}
