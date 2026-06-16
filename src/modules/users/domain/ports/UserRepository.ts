import { User } from "@users/domain/entities/User";
import { Role } from "@users/domain/enums/Role";

export interface CreateUserData {
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  activateWithSpecialties(userId: string, specialtyIds: string[]): Promise<User>;
  listInactive(): Promise<User[]>;
  listActive(): Promise<User[]>;
  listActiveBySpecialty(specialtyId: string): Promise<User[]>;
  setRole(userId: string, role: Role): Promise<User>;
  updateSpecialties(userId: string, specialtyIds: string[]): Promise<void>;
  getUserSpecialtyIds(userId: string): Promise<string[]>;
  createPasswordResetToken(data: { token: string; userId: string; expiresAt: Date }): Promise<void>;
  findPasswordResetToken(token: string): Promise<{ userId: string; expiresAt: Date; used: boolean } | null>;
  markPasswordResetTokenUsed(token: string): Promise<void>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}
