import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import { CreateShiftData, ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";

export class InMemoryShiftReplacementRepository implements ShiftReplacementRepository {
  private items: ShiftReplacement[] = [];
  private seq = 0;

  async findById(id: string): Promise<ShiftReplacement | null> {
    return this.items.find((s) => s.id === id) ?? null;
  }
  async create(data: CreateShiftData): Promise<ShiftReplacement> {
    const s = ShiftReplacement.fromPersistence({
      id: `r${++this.seq}`, date: data.date, state: data.state,
      requesterId: data.requesterId, specialtyId: data.specialtyId,
      applicantId: data.applicantId, resolvedById: data.resolvedById,
    });
    this.items.push(s);
    return s;
  }
  async save(shift: ShiftReplacement): Promise<ShiftReplacement> {
    this.items = this.items.map((s) => (s.id === shift.id ? shift : s));
    return shift;
  }
  async listOpenBySpecialty(specialtyId: string): Promise<ShiftReplacement[]> {
    return this.items.filter((s) => s.specialtyId === specialtyId && s.state === RequestState.OPEN);
  }
  async listByState(state: RequestState): Promise<ShiftReplacement[]> {
    return this.items.filter((s) => s.state === state);
  }
}
