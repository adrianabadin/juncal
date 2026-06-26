import { z } from "zod";
import { SHIFT_MODULES } from "@shift-replacements/domain/enums/ShiftModule";

const moduleHours = z.coerce
  .number()
  .refine(
    (n): n is (typeof SHIFT_MODULES)[number] =>
      (SHIFT_MODULES as readonly number[]).includes(n),
    "El módulo debe ser de 6, 12 o 24 horas",
  );

// Canonical name of the seeded reason that requires an observation. The id→name
// resolution is authoritative in the use-case (via the repository); the optional
// `absenceReasonName` lets the form mirror that rule client-side so the
// conditional observation textarea validates before submission.
export const OTROS_REASON_NAME = "Otros";

const absenceReasonId = z.string().min(1, "Seleccione un motivo");
const observation = z
  .string()
  .max(500, "La observación no puede superar 500 caracteres")
  .optional()
  .nullable()
  .transform((v) => v ?? null);
const absenceReasonName = z.string().optional();

// Require an observation only when the selected reason is "Otros".
function requireObservationForOtros(
  d: { absenceReasonName?: string; observation: string | null },
  ctx: z.RefinementCtx,
): void {
  if (d.absenceReasonName === OTROS_REASON_NAME && !d.observation?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Ingrese una observación",
      path: ["observation"],
    });
  }
}

export const requestAbsenceSchema = z
  .object({
    specialtyId: z.string().min(1),
    moduleHours,
    requesterStart: z.coerce.date(),
    requesterEnd: z.coerce.date(),
    absenceReasonId,
    absenceReasonName,
    observation,
  })
  .refine((d) => d.requesterEnd > d.requesterStart, {
    message: "La salida debe ser posterior a la entrada",
    path: ["requesterEnd"],
  })
  .superRefine(requireObservationForOtros);
export type RequestAbsenceInput = z.infer<typeof requestAbsenceSchema>;

export const postulateSchema = z
  .object({
    shiftId: z.string().min(1),
    start: z.coerce.date(),
    end: z.coerce.date(),
  })
  .refine((d) => d.end > d.start, {
    message: "La salida debe ser posterior a la entrada",
    path: ["end"],
  });
export type PostulateInput = z.infer<typeof postulateSchema>;

export const assignCompulsoryCoverageSchema = z
  .object({
    shiftId: z.string().min(1),
    applicantId: z.string().min(1),
    start: z.coerce.date(),
    end: z.coerce.date(),
  })
  .refine((d) => d.end > d.start, {
    message: "La salida debe ser posterior a la entrada",
    path: ["end"],
  });
export type AssignCompulsoryCoverageInput = z.infer<
  typeof assignCompulsoryCoverageSchema
>;

export const resolveRequestSchema = z.object({
  shiftId: z.string().min(1),
  action: z.enum(["CONFIRM", "REJECT_REQUEST"]),
});
export type ResolveRequestInput = z.infer<typeof resolveRequestSchema>;

export const removeCoverageSchema = z.object({
  coverageId: z.string().min(1),
});
export type RemoveCoverageInput = z.infer<typeof removeCoverageSchema>;

export const createCompulsorySchema = z
  .object({
    specialtyId: z.string().min(1),
    moduleHours,
    requesterStart: z.coerce.date(),
    requesterEnd: z.coerce.date(),
    requesterId: z.string().min(1),
    applicantId: z.string().min(1),
    coverageStart: z.coerce.date(),
    coverageEnd: z.coerce.date(),
    absenceReasonId,
    absenceReasonName,
    observation,
  })
  .refine((d) => d.requesterEnd > d.requesterStart, {
    message: "La salida del turno debe ser posterior a la entrada",
    path: ["requesterEnd"],
  })
  .refine((d) => d.coverageEnd > d.coverageStart, {
    message: "La salida de la cobertura debe ser posterior a la entrada",
    path: ["coverageEnd"],
  })
  .superRefine(requireObservationForOtros);
export type CreateCompulsoryInput = z.infer<typeof createCompulsorySchema>;
