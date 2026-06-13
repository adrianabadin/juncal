import { Specialty } from "@specialties/domain/entities/Specialty";
import { CreateSpecialtyData, SpecialtyRepository } from "@specialties/domain/ports/SpecialtyRepository";

export class InMemorySpecialtyRepository implements SpecialtyRepository {
  private items: Specialty[] = [];
  private seq = 0;

  async findById(id: string): Promise<Specialty | null> {
    return this.items.find((s) => s.id === id) ?? null;
  }
  async findByName(name: string): Promise<Specialty | null> {
    return this.items.find((s) => s.name.toLowerCase() === name.toLowerCase()) ?? null;
  }
  async create(data: CreateSpecialtyData): Promise<Specialty> {
    const s = Specialty.fromPersistence({
      id: `s${++this.seq}`, name: data.name, description: data.description, isActive: true,
    });
    this.items.push(s);
    return s;
  }
  async save(specialty: Specialty): Promise<Specialty> {
    this.items = this.items.map((s) => (s.id === specialty.id ? specialty : s));
    return specialty;
  }
  async delete(id: string): Promise<void> {
    this.items = this.items.filter((s) => s.id !== id);
  }
  async list(): Promise<Specialty[]> { return [...this.items]; }
}
