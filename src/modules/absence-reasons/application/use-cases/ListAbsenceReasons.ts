import { AbsenceReason } from "@absence-reasons/domain/entities/AbsenceReason";
import { AbsenceReasonRepository } from "@absence-reasons/domain/ports/AbsenceReasonRepository";

export class ListAbsenceReasons {
  constructor(private readonly repo: AbsenceReasonRepository) {}
  async execute(): Promise<AbsenceReason[]> { return this.repo.list(); }
}
