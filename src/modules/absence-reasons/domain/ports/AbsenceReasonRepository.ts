import { AbsenceReason } from "@absence-reasons/domain/entities/AbsenceReason";

export interface CreateAbsenceReasonData {
  name: string;
  isDefault?: boolean;
}

export interface AbsenceReasonRepository {
  findById(id: string): Promise<AbsenceReason | null>;
  findByName(name: string): Promise<AbsenceReason | null>;
  list(): Promise<AbsenceReason[]>;
  listActive(): Promise<AbsenceReason[]>;
  create(data: CreateAbsenceReasonData): Promise<AbsenceReason>;
  save(reason: AbsenceReason): Promise<AbsenceReason>;
  delete(id: string): Promise<void>;
}
