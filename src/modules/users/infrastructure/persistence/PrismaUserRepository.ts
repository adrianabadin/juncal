import { prisma } from "@shared/infrastructure/prisma/client";
import { User } from "@users/domain/entities/User";
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
}
