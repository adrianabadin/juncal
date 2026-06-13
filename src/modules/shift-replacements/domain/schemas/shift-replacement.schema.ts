import { z } from "zod";

export const requestAbsenceSchema = z.object({
  date: z.coerce.date(),
  specialtyId: z.string().min(1),
});
export type RequestAbsenceInput = z.infer<typeof requestAbsenceSchema>;

export const assignCompulsorySchema = z.object({
  date: z.coerce.date(),
  specialtyId: z.string().min(1),
  requesterId: z.string().min(1),
  applicantId: z.string().min(1),
});
export type AssignCompulsoryInput = z.infer<typeof assignCompulsorySchema>;
