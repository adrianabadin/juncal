import { z } from "zod";

export const createSpecialtySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});
export type CreateSpecialtyInput = z.infer<typeof createSpecialtySchema>;

export const updateSpecialtySchema = createSpecialtySchema.extend({
  id: z.string().min(1),
});
export type UpdateSpecialtyInput = z.infer<typeof updateSpecialtySchema>;
