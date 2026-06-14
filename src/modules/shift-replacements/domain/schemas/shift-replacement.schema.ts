import { z } from "zod";
import { SHIFT_MODULES } from "@shift-replacements/domain/enums/ShiftModule";

const moduleHours = z.coerce
  .number()
  .refine(
    (n): n is (typeof SHIFT_MODULES)[number] =>
      (SHIFT_MODULES as readonly number[]).includes(n),
    "El módulo debe ser de 6, 12 o 24 horas",
  );

export const requestAbsenceSchema = z
  .object({
    specialtyId: z.string().min(1),
    moduleHours,
    requesterStart: z.coerce.date(),
    requesterEnd: z.coerce.date(),
  })
  .refine((d) => d.requesterEnd > d.requesterStart, {
    message: "La salida debe ser posterior a la entrada",
    path: ["requesterEnd"],
  });
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
