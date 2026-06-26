import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { ShiftCoverage } from "@shift-replacements/domain/entities/ShiftCoverage";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import { CoverageOrigin } from "@shift-replacements/domain/enums/CoverageOrigin";

export interface CreateShiftData {
  date: Date;
  requesterId: string;
  specialtyId: string;
  moduleHours: number;
  requesterStart: Date;
  requesterEnd: Date;
  state: RequestState;
  resolvedById: string | null;
  absenceReasonId: string | null;
  observation: string | null;
}

export interface CreateCoverageData {
  shiftReplacementId: string;
  applicantId: string;
  start: Date;
  end: Date;
  origin: CoverageOrigin;
}

export interface ShiftReplacementRepository {
  findById(id: string): Promise<ShiftReplacement | null>;
  create(data: CreateShiftData): Promise<ShiftReplacement>;
  save(shift: ShiftReplacement): Promise<ShiftReplacement>;
  listOpenBySpecialty(specialtyId: string): Promise<ShiftReplacement[]>;
  listByState(state: RequestState): Promise<ShiftReplacement[]>;

  addCoverage(data: CreateCoverageData): Promise<ShiftCoverage>;
  removeCoverage(coverageId: string): Promise<void>;
  findCoverageById(coverageId: string): Promise<ShiftCoverage | null>;
  listCoverages(shiftReplacementId: string): Promise<ShiftCoverage[]>;
}
