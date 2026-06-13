import { Specialty } from "@specialties/domain/entities/Specialty";
import { SpecialtyRepository } from "@specialties/domain/ports/SpecialtyRepository";

export class ListSpecialties {
  constructor(private readonly repo: SpecialtyRepository) {}
  async execute(): Promise<Specialty[]> { return this.repo.list(); }
}
