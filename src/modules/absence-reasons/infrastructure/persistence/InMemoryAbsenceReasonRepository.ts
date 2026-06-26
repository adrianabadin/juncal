import { AbsenceReason } from "@absence-reasons/domain/entities/AbsenceReason";
import {
  AbsenceReasonRepository,
  CreateAbsenceReasonData,
} from "@absence-reasons/domain/ports/AbsenceReasonRepository";

export class InMemoryAbsenceReasonRepository implements AbsenceReasonRepository {
  private items: AbsenceReason[] = [];
  private seq = 0;

  async findById(id: string): Promise<AbsenceReason | null> {
    return this.items.find((r) => r.id === id) ?? null;
  }
  async findByName(name: string): Promise<AbsenceReason | null> {
    return this.items.find((r) => r.name.toLowerCase() === name.toLowerCase()) ?? null;
  }
  async list(): Promise<AbsenceReason[]> { return [...this.items]; }
  async listActive(): Promise<AbsenceReason[]> {
    return this.items.filter((r) => r.isActive);
  }
  async create(data: CreateAbsenceReasonData): Promise<AbsenceReason> {
    const reason = AbsenceReason.fromPersistence({
      id: `ar${++this.seq}`,
      name: data.name,
      isDefault: data.isDefault ?? false,
      isActive: true,
    });
    this.items.push(reason);
    return reason;
  }
  async save(reason: AbsenceReason): Promise<AbsenceReason> {
    this.items = this.items.map((r) => (r.id === reason.id ? reason : r));
    return reason;
  }
  async delete(id: string): Promise<void> {
    this.items = this.items.filter((r) => r.id !== id);
  }
}
