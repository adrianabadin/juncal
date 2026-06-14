import { prisma } from "@shared/infrastructure/prisma/client";
import { User } from "@users/domain/entities/User";
import { Role } from "@users/domain/enums/Role";
import { CreateUserData, UserRepository } from "@users/domain/ports/UserRepository";
import { UserMapper } from "@users/infrastructure/mappers/UserMapper";

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const row = await prisma.user.create({
      data: {
        email: data.email,
        password: data.passwordHash,
        name: data.name,
        isActive: false,
        role: data.role,
      },
    });
    return UserMapper.toDomain(row);
  }

  async activateWithSpecialties(userId: string, specialtyIds: string[]): Promise<User> {
    const row = await prisma.$transaction(async (tx) => {
      await tx.userSpecialty.deleteMany({ where: { userId } });

      if (specialtyIds.length > 0) {
        await tx.userSpecialty.createMany({
          data: specialtyIds.map((specialtyId) => ({ userId, specialtyId })),
        });
      }

      return tx.user.update({
        where: { id: userId },
        data: { isActive: true },
      });
    });

    return UserMapper.toDomain(row);
  }

  async listInactive(): Promise<User[]> {
    const rows = await prisma.user.findMany({ where: { isActive: false } });
    return rows.map(UserMapper.toDomain);
  }

  async listActive(): Promise<User[]> {
    const rows = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return rows.map(UserMapper.toDomain);
  }

  async setRole(userId: string, role: Role): Promise<User> {
    const row = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    return UserMapper.toDomain(row);
  }

  async listActiveBySpecialty(specialtyId: string): Promise<User[]> {
    const rows = await prisma.user.findMany({
      where: {
        isActive: true,
        specialties: { some: { specialtyId } },
      },
      orderBy: { name: "asc" },
    });
    return rows.map(UserMapper.toDomain);
  }

  async updateSpecialties(userId: string, specialtyIds: string[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.userSpecialty.deleteMany({ where: { userId } });
      if (specialtyIds.length > 0) {
        await tx.userSpecialty.createMany({
          data: specialtyIds.map((specialtyId) => ({ userId, specialtyId })),
        });
      }
    });
  }

  async getUserSpecialtyIds(userId: string): Promise<string[]> {
    const rows = await prisma.userSpecialty.findMany({
      where: { userId },
      select: { specialtyId: true },
    });
    return rows.map((r) => r.specialtyId);
  }
}
