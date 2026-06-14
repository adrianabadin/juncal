import { User } from "@users/domain/entities/User";
import { Role } from "@users/domain/enums/Role";
import { CreateUserData, UserRepository } from "@users/domain/ports/UserRepository";

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];
  private specialtiesByUser = new Map<string, string[]>();
  private seq = 0;

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }
  async create(data: CreateUserData): Promise<User> {
    const user = User.fromPersistence({
      id: `u${++this.seq}`, email: data.email, passwordHash: data.passwordHash,
      name: data.name, isActive: false, role: data.role,
    });
    this.users.push(user);
    return user;
  }
  async activateWithSpecialties(userId: string, specialtyIds: string[]): Promise<User> {
    const u = await this.findById(userId);
    if (!u) throw new Error("not found");
    u.activate();
    this.specialtiesByUser.set(userId, [...specialtyIds]);
    return u;
  }
  async listInactive(): Promise<User[]> {
    return this.users.filter((u) => !u.isActive);
  }
  async listActive(): Promise<User[]> {
    return this.users.filter((u) => u.isActive);
  }
  async listActiveBySpecialty(specialtyId: string): Promise<User[]> {
    return this.users.filter(
      (u) =>
        u.isActive &&
        (this.specialtiesByUser.get(u.id)?.includes(specialtyId) ?? false),
    );
  }
  async setRole(userId: string, role: Role): Promise<User> {
    const u = await this.findById(userId);
    if (!u) throw new Error("not found");
    u.changeRole(role);
    return u;
  }
}
