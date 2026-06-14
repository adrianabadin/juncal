import { prisma } from "@shared/infrastructure/prisma/client";

export async function prismaHasSpecialty(
  userId: string,
  specialtyId: string
): Promise<boolean> {
  const link = await prisma.userSpecialty.findUnique({
    where: { userId_specialtyId: { userId, specialtyId } },
  });
  return link !== null;
}
