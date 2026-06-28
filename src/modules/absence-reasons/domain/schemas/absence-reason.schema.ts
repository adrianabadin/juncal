import { z } from "zod";

export const createAbsenceReasonSchema = z.object({
  name: z.string().min(2),
});
export type CreateAbsenceReasonInput = z.infer<typeof createAbsenceReasonSchema>;

export const updateAbsenceReasonSchema = createAbsenceReasonSchema.extend({
  id: z.string().min(1),
});
export type UpdateAbsenceReasonInput = z.infer<typeof updateAbsenceReasonSchema>;

export const deleteAbsenceReasonSchema = z.object({
  id: z.string().min(1),
});
export type DeleteAbsenceReasonInput = z.infer<typeof deleteAbsenceReasonSchema>;
