import argon2 from "argon2";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { Role } from "../src/modules/users/domain/enums/Role";

// Bootstrap del sistema: crea el primer COORDINATOR y especialidades base.
// Sin esto no existe forma de activar cuentas (la activación requiere un coordinador previo).
const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const coordinatorEmail = "coordinador@juncal.local";
  const existing = await prisma.user.findUnique({ where: { email: coordinatorEmail } });

  if (!existing) {
    const passwordHash = await argon2.hash("coordinador123");
    await prisma.user.create({
      data: {
        email: coordinatorEmail,
        password: passwordHash,
        name: "Coordinador General",
        isActive: true,
        role: Role.COORDINATOR,
      },
    });
    console.log(`✓ Coordinador creado: ${coordinatorEmail} / coordinador123`);
  } else {
    console.log(`• Coordinador ya existe: ${coordinatorEmail}`);
  }

  const specialties = ["Pediatría", "Emergentología", "Clínica Médica", "Cirugía"];
  for (const name of specialties) {
    await prisma.specialty.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✓ Especialidades base aseguradas: ${specialties.join(", ")}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e: unknown) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
