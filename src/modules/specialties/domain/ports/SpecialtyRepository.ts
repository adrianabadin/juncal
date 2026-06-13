import { Specialty } from "@specialties/domain/entities/Specialty";

export interface CreateSpecialtyData { name: string; description: string | null; }

export interface SpecialtyRepository {
  findById(id: string): Promise<Specialty | null>;
  findByName(name: string): Promise<Specialty | null>;
  create(data: CreateSpecialtyData): Promise<Specialty>;
  save(specialty: Specialty): Promise<Specialty>;
  delete(id: string): Promise<void>;
  list(): Promise<Specialty[]>;
}
