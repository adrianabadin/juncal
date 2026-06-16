import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import { ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";

export type ResolveAction = "CONFIRM" | "REJECT_REQUEST";

export interface ResolveRequestCommand {
  shiftId: string;
  action: ResolveAction;
  coordinatorId: string;
  actorIsCoordinator: boolean;
}

// El coordinador confirma o rechaza la solicitud completa. Puede confirmar aun
// cuando queden tramos sin cubrir (la cobertura es a su criterio).
// Al confirmar, si hay huecos sin cubrir se generan nuevos turnos abiertos
// para que otros profesionales puedan postularse a las horas faltantes.
export class ResolveRequest {
  constructor(private readonly repo: ShiftReplacementRepository) {}

  async execute(
    cmd: ResolveRequestCommand,
  ): Promise<Result<ShiftReplacement, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(
        new DomainError("FORBIDDEN", "Solo el coordinador resuelve solicitudes"),
      );

    const shift = await this.repo.findById(cmd.shiftId);
    if (!shift)
      return err(new DomainError("SHIFT_NOT_FOUND", "Solicitud inexistente"));

    const transition =
      cmd.action === "CONFIRM"
        ? shift.confirm(cmd.coordinatorId)
        : shift.rejectRequest(cmd.coordinatorId);

    if (!transition.isOk) return err(transition.error);
    const saved = await this.repo.save(shift);

    if (cmd.action === "CONFIRM") {
      await this.createShiftsForGaps(saved);
      await this.sendConfirmationEmails(saved);
    }

    return ok(saved);
  }

  private async createShiftsForGaps(confirmed: ShiftReplacement): Promise<void> {
    const coverages = await this.repo.listCoverages(confirmed.id);
    if (coverages.length === 0) return;

    const sorted = [...coverages].sort((a, b) => a.start.getTime() - b.start.getTime());
    const gaps: { start: Date; end: Date }[] = [];

    if (sorted[0].start > confirmed.requesterStart) {
      gaps.push({ start: confirmed.requesterStart, end: sorted[0].start });
    }

    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].end < sorted[i + 1].start) {
        gaps.push({ start: sorted[i].end, end: sorted[i + 1].start });
      }
    }

    const last = sorted[sorted.length - 1];
    if (last.end < confirmed.requesterEnd) {
      gaps.push({ start: last.end, end: confirmed.requesterEnd });
    }

    for (const gap of gaps) {
      const durationMs = gap.end.getTime() - gap.start.getTime();
      const hours = Math.round(durationMs / (1000 * 60 * 60));
      const moduleHours = hours > 0 ? hours : 1;

      await this.repo.create({
        date: gap.start,
        requesterId: confirmed.requesterId,
        specialtyId: confirmed.specialtyId,
        moduleHours,
        requesterStart: gap.start,
        requesterEnd: gap.end,
        state: RequestState.OPEN,
        resolvedById: null,
      });
    }
  }

  private async sendConfirmationEmails(shift: ShiftReplacement): Promise<void> {
    try {
      const { sendConfirmationEmail } = await import("@/modules/emails/sendEmail");
      const coverages = await this.repo.listCoverages(shift.id);
      const { prisma } = await import("@/shared/infrastructure/prisma/client");

      const userIds = [shift.requesterId, ...coverages.map((c) => c.applicantId)];
      const users = userIds.length > 0
        ? await prisma.user.findMany({ where: { id: { in: [...new Set(userIds)] } }, select: { id: true, name: true, email: true } })
        : [];
      const userById = new Map(users.map((u) => [u.id, u]));
      const specialty = await prisma.specialty.findUnique({ where: { id: shift.specialtyId }, select: { name: true } });

      const dateStr = shift.requesterStart.toLocaleDateString("es-AR");
      const startStr = shift.requesterStart.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      const endStr = shift.requesterEnd.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

      for (const cov of coverages) {
        const applicant = userById.get(cov.applicantId);
        if (applicant?.email) {
          await sendConfirmationEmail(applicant.email, applicant.name, specialty?.name ?? "", dateStr, startStr, endStr);
        }
      }

      const requester = userById.get(shift.requesterId);
      if (requester?.email) {
        await sendConfirmationEmail(requester.email, requester.name, specialty?.name ?? "", dateStr, startStr, endStr);
      }
    } catch (e) {
      console.error("Failed to send confirmation emails:", e);
    }
  }
}
