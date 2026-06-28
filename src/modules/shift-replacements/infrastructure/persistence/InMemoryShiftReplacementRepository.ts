import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { ShiftCoverage } from "@shift-replacements/domain/entities/ShiftCoverage";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import {
  CreateCoverageData,
  CreateShiftData,
  ShiftReplacementRepository,
} from "@shift-replacements/domain/ports/ShiftReplacementRepository";

export class InMemoryShiftReplacementRepository
  implements ShiftReplacementRepository
{
  private items: ShiftReplacement[] = [];
  private coverages: ShiftCoverage[] = [];
  private seq = 0;
  private covSeq = 0;

  async findById(id: string): Promise<ShiftReplacement | null> {
    return this.items.find((s) => s.id === id) ?? null;
  }
  async create(data: CreateShiftData): Promise<ShiftReplacement> {
    const s = ShiftReplacement.fromPersistence({
      id: `r${++this.seq}`,
      date: data.date,
      state: data.state,
      requesterId: data.requesterId,
      specialtyId: data.specialtyId,
      moduleHours: data.moduleHours,
      requesterStart: data.requesterStart,
      requesterEnd: data.requesterEnd,
      resolvedById: data.resolvedById,
      absenceReasonId: data.absenceReasonId,
      observation: data.observation,
      bajoFactura: data.bajoFactura,
    });
    this.items.push(s);
    return s;
  }
  async save(shift: ShiftReplacement): Promise<ShiftReplacement> {
    this.items = this.items.map((s) => (s.id === shift.id ? shift : s));
    return shift;
  }
  async listOpenBySpecialty(specialtyId: string): Promise<ShiftReplacement[]> {
    return this.items.filter(
      (s) => s.specialtyId === specialtyId && s.state === RequestState.OPEN,
    );
  }
  async listByState(state: RequestState): Promise<ShiftReplacement[]> {
    return this.items.filter((s) => s.state === state);
  }

  async addCoverage(data: CreateCoverageData): Promise<ShiftCoverage> {
    const c = ShiftCoverage.fromPersistence({
      id: `c${++this.covSeq}`,
      shiftReplacementId: data.shiftReplacementId,
      applicantId: data.applicantId,
      start: data.start,
      end: data.end,
      origin: data.origin,
    });
    this.coverages.push(c);
    return c;
  }
  async removeCoverage(coverageId: string): Promise<void> {
    this.coverages = this.coverages.filter((c) => c.id !== coverageId);
  }
  async findCoverageById(coverageId: string): Promise<ShiftCoverage | null> {
    return this.coverages.find((c) => c.id === coverageId) ?? null;
  }
  async listCoverages(shiftReplacementId: string): Promise<ShiftCoverage[]> {
    return this.coverages.filter(
      (c) => c.shiftReplacementId === shiftReplacementId,
    );
  }
  async findOverlappingCoverages(applicantId: string, start: Date, end: Date): Promise<ShiftCoverage[]> {
    return this.coverages.filter(
      (c) => c.applicantId === applicantId && c.start < end && c.end > start,
    );
  }
}
