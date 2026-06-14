import { User as PrismaUser } from "@/generated/prisma/client";
import { User } from "@users/domain/entities/User";
import { Role, isRole } from "@users/domain/enums/Role";

export class UserMapper {
  static toDomain(row: PrismaUser): User {
    const role: Role = isRole(row.role) ? row.role : Role.BASE_PROFESSIONAL;
    return User.fromPersistence({
      id: row.id,
      email: row.email,
      passwordHash: row.password,
      name: row.name,
      isActive: row.isActive,
      role,
    });
  }
}
