import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";

export interface CreateShiftData {
  date: Date;
  requesterId: string;
  specialtyId: string;
  applicantId: string | null;
  state: RequestState;
  resolvedById: string | null;
}

export interface ShiftReplacementRepository {
  findById(id: string): Promise<ShiftReplacement | null>;
  create(data: CreateShiftData): Promise<ShiftReplacement>;
  save(shift: ShiftReplacement): Promise<ShiftReplacement>;
  listOpenBySpecialty(specialtyId: string): Promise<ShiftReplacement[]>;
  listByState(state: RequestState): Promise<ShiftReplacement[]>;
}
