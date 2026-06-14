import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";

export interface RemoveCoverageCommand {
  actorIsCoordinator: boolean;
  coverageId: string;
}

// El coordinador rechaza/quita una cobertura (postulación o compulsiva).
export class RemoveCoverage {
  constructor(private readonly repo: ShiftReplacementRepository) {}

  async execute(
    cmd: RemoveCoverageCommand,
  ): Promise<Result<void, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(
        new DomainError("FORBIDDEN", "Solo el coordinador gestiona coberturas"),
      );

    const coverage = await this.repo.findCoverageById(cmd.coverageId);
    if (!coverage)
      return err(new DomainError("COVERAGE_NOT_FOUND", "Cobertura inexistente"));

    await this.repo.removeCoverage(cmd.coverageId);
    return ok(undefined);
  }
}
