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
}
