import { z } from "zod";

export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  name: z.string().min(2),
});
export type RegisterUserInput = z.infer<typeof registerUserSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const activateUserSchema = z.object({
  userId: z.string().min(1),
  specialtyIds: z.array(z.string().min(1)).min(1, "Asigná al menos una especialidad"),
});
export type ActivateUserInput = z.infer<typeof activateUserSchema>;

export const changeUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["BASE_PROFESSIONAL", "COORDINATOR", "RRHH"]),
});
export type ChangeUserRoleInput = z.infer<typeof changeUserRoleSchema>;

export const updateSpecialtiesSchema = z.object({
  userId: z.string().min(1),
  specialtyIds: z.array(z.string().min(1)),
});
export type UpdateSpecialtiesInput = z.infer<typeof updateSpecialtiesSchema>;
