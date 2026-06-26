import { z } from "zod";
import { SHIFT_MODULES } from "@shift-replacements/domain/enums/ShiftModule";

const moduleHours = z.coerce
  .number()
  .refine(
    (n): n is (typeof SHIFT_MODULES)[number] =>
      (SHIFT_MODULES as readonly number[]).includes(n),
    "El módulo debe ser de 6, 12 o 24 horas",
  );

<<<<<<< Updated upstream
=======
const absenceReasonId = z.string().min(1, "Seleccione un motivo");
const observation = z
  .string()
  .max(500, "La observación no puede superar 500 caracteres")
  .optional()
  .nullable()
  .transform((v) => v ?? null);
// Whether the selected reason is a protected default. The id→isDefault
// resolution is authoritative in the use-case (via the repository); this
// optional flag lets the form mirror the rule client-side so the conditional
// observation textarea validates before submission. The server-side use-case
// re-validates against the repository regardless of this value.
const isDefault = z.boolean().optional();
const bajoFactura = z.boolean().optional().default(false);

// Require an observation only for custom (non-default) reasons.
function requireObservationForCustom(
  d: { isDefault?: boolean; observation: string | null },
  ctx: z.RefinementCtx,
): void {
  if (d.isDefault === false && !d.observation?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Ingrese una observación",
      path: ["observation"],
    });
  }
}

>>>>>>> Stashed changes
export const requestAbsenceSchema = z
  .object({
    specialtyId: z.string().min(1),
    moduleHours,
    requesterStart: z.coerce.date(),
    requesterEnd: z.coerce.date(),
<<<<<<< Updated upstream
=======
    absenceReasonId,
    isDefault,
    observation,
    bajoFactura,
>>>>>>> Stashed changes
  })
  .refine((d) => d.requesterEnd > d.requesterStart, {
    message: "La salida debe ser posterior a la entrada",
    path: ["requesterEnd"],
<<<<<<< Updated upstream
  });
=======
  })
  .superRefine(requireObservationForCustom);
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
    absenceReasonId,
    isDefault,
    observation,
    bajoFactura,
>>>>>>> Stashed changes
  })
  .refine((d) => d.requesterEnd > d.requesterStart, {
    message: "La salida del turno debe ser posterior a la entrada",
    path: ["requesterEnd"],
  })
  .refine((d) => d.coverageEnd > d.coverageStart, {
    message: "La salida de la cobertura debe ser posterior a la entrada",
    path: ["coverageEnd"],
<<<<<<< Updated upstream
  });
=======
  })
  .superRefine(requireObservationForCustom);
>>>>>>> Stashed changes
export type CreateCompulsoryInput = z.infer<typeof createCompulsorySchema>;
