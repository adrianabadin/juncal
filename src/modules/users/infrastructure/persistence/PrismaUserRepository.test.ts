import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@shared/infrastructure/prisma/client";
import { PrismaUserRepository } from "./PrismaUserRepository";
import { PrismaSpecialtyRepository } from "@specialties/infrastructure/persistence/PrismaSpecialtyRepository";
import { prismaHasSpecialty } from "./prismaHasSpecialty";
import { Role } from "@users/domain/enums/Role";

const userRepo = new PrismaUserRepository();
const specialtyRepo = new PrismaSpecialtyRepository();

const testEmail = `test-${Date.now()}@integration.test`;
const specialtyName = `TestSpecialty-${Date.now()}`;

let createdUserId: string | null = null;
let createdSpecialtyId: string | null = null;

afterAll(async () => {
  // Clean up in FK-safe order: userSpecialty rows are cascade-deleted with user
  if (createdUserId) {
    await prisma.user.deleteMany({ where: { id: createdUserId } });
  }
  if (createdSpecialtyId) {
    await prisma.specialty.deleteMany({ where: { id: createdSpecialtyId } });
  }
  await prisma.$disconnect();
});

describe("PrismaUserRepository – integration", () => {
  it("creates a user as inactive BASE_PROFESSIONAL", async () => {
    const user = await userRepo.create({
      email: testEmail,
      passwordHash: "hashed-pw",
      name: "Test User",
      role: Role.BASE_PROFESSIONAL,
    });

    createdUserId = user.id;

    expect(user.id).toBeTruthy();
    expect(user.email).toBe(testEmail);
    expect(user.isActive).toBe(false);
    expect(user.role).toBe(Role.BASE_PROFESSIONAL);
    expect(user.passwordHash).toBe("hashed-pw");
  });

  it("finds user by email", async () => {
    const found = await userRepo.findByEmail(testEmail);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(createdUserId);
  });

  it("finds user by id", async () => {
    const found = await userRepo.findById(createdUserId!);
    expect(found).not.toBeNull();
    expect(found!.email).toBe(testEmail);
  });

  it("returns null for non-existent email", async () => {
    const found = await userRepo.findByEmail("nobody@nowhere.invalid");
    expect(found).toBeNull();
  });

  it("lists inactive users includes newly created user", async () => {
    const inactive = await userRepo.listInactive();
    const ids = inactive.map((u) => u.id);
    expect(ids).toContain(createdUserId);
  });

  it("activateWithSpecialties sets isActive=true and links specialty", async () => {
    const specialty = await specialtyRepo.create({
      name: specialtyName,
      description: null,
    });
    createdSpecialtyId = specialty.id;

    const activated = await userRepo.activateWithSpecialties(createdUserId!, [
      specialty.id,
    ]);

    expect(activated.isActive).toBe(true);
    expect(activated.id).toBe(createdUserId);

    const hasSpecialty = await prismaHasSpecialty(createdUserId!, specialty.id);
    expect(hasSpecialty).toBe(true);
  });

  it("prismaHasSpecialty returns false for non-existent link", async () => {
    const has = await prismaHasSpecialty(createdUserId!, "non-existent-specialty-id");
    expect(has).toBe(false);
  });

  it("activated user no longer appears in listInactive", async () => {
    const inactive = await userRepo.listInactive();
    const ids = inactive.map((u) => u.id);
    expect(ids).not.toContain(createdUserId);
  });
});
