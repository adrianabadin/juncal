import argon2 from "argon2";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { Role } from "../src/modules/users/domain/enums/Role";
import { defaultAbsenceReasons } from "../src/modules/absence-reasons/domain/defaultAbsenceReasons";

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

  // Motivos de ausencia por defecto: protegidos (no se pueden borrar, solo editar/desactivar).
  for (const reason of defaultAbsenceReasons) {
    await prisma.absenceReason.upsert({
      where: { name: reason.name },
      update: { isDefault: reason.isDefault },
      create: {
        name: reason.name,
        isDefault: reason.isDefault,
        isActive: reason.isActive,
      },
    });
  }
  console.log(
    `✓ Motivos de ausencia por defecto asegurados: ${defaultAbsenceReasons.map((r) => r.name).join(", ")}`,
  );

  // Motivo "Otros": se crea como razón custom (no-default) para poder probar
  // el flujo de observación obligatoria. Se upsert con la misma forma idempotente
  // que los motivos por defecto.
  await prisma.absenceReason.upsert({
    where: { name: "Otros" },
    update: { isDefault: false, isActive: true },
    create: {
      name: "Otros",
      isDefault: false,
      isActive: true,
    },
  });
  console.log(`✓ Motivo "Otros" asegurado`);

  // Profesionales demo (activos, con especialidades asignadas) para poder probar
  // postulaciones y reemplazos compulsivos sin tener que dar de alta a mano.
  const demoDoctors: { email: string; name: string; specialties: string[] }[] = [
    { email: "ana.perez@juncal.local", name: "Dra. Ana Pérez", specialties: ["Pediatría", "Clínica Médica"] },
    { email: "luis.gomez@juncal.local", name: "Dr. Luis Gómez", specialties: ["Pediatría"] },
    { email: "marta.ruiz@juncal.local", name: "Dra. Marta Ruiz", specialties: ["Emergentología"] },
    { email: "juan.diaz@juncal.local", name: "Dr. Juan Díaz", specialties: ["Emergentología", "Cirugía"] },
  ];

  const demoPasswordHash = await argon2.hash("profesional123");
  for (const doc of demoDoctors) {
    const user = await prisma.user.upsert({
      where: { email: doc.email },
      update: { isActive: true },
      create: {
        email: doc.email,
        password: demoPasswordHash,
        name: doc.name,
        isActive: true,
        role: Role.BASE_PROFESSIONAL,
      },
    });

    for (const specialtyName of doc.specialties) {
      const specialty = await prisma.specialty.findUnique({ where: { name: specialtyName } });
      if (!specialty) continue;
      await prisma.userSpecialty.upsert({
        where: { userId_specialtyId: { userId: user.id, specialtyId: specialty.id } },
        update: {},
        create: { userId: user.id, specialtyId: specialty.id },
      });
    }
  }
  console.log(`✓ ${demoDoctors.length} profesionales demo asegurados (clave: profesional123)`);

  // Usuario demo de RRHH: cuenta activa con perfil profesional base. Sirve
  // como referencia de login para inspeccionar el panel y verificar seeds.
  // Nota: queda con `BASE_PROFESSIONAL` (no `Role.RRHH`) a propósito: el panel
  // /rrhh solo lo verá si un coordinador le asigna ese rol desde la
  // administración, evitando accesos prematuros a datos sensibles.
  const rrhhDemoEmail = "rrhh.demo@juncal.local";
  await prisma.user.upsert({
    where: { email: rrhhDemoEmail },
    update: { isActive: true },
    create: {
      email: rrhhDemoEmail,
      password: demoPasswordHash,
      name: "Prof. RRHH Demo",
      isActive: true,
      role: Role.BASE_PROFESSIONAL,
    },
  });
  console.log(`✓ Usuario RRHH demo asegurado: ${rrhhDemoEmail} (clave: profesional123)`);

  // Reemplazos de ejemplo para verificar el dashboard y el export. Se crean
  // variedad de motivos: uno con "Otros" + observación obligatoria y otro con
  // motivo por defecto + observación nula.
  const requesterForSeed = await prisma.user.findUnique({
    where: { email: "ana.perez@juncal.local" },
  });
  const pediatria = await prisma.specialty.findUnique({
    where: { name: "Pediatría" },
  });
  const otrosReason = await prisma.absenceReason.findUnique({
    where: { name: "Otros" },
  });
  const vacacionesReason = await prisma.absenceReason.findUnique({
    where: { name: "Vacaciones" },
  });

  if (requesterForSeed && pediatria && otrosReason && vacacionesReason) {
    const seedShifts = [
      {
        date: new Date("2026-08-10T08:00:00.000Z"),
        requesterStart: new Date("2026-08-10T08:00:00.000Z"),
        requesterEnd: new Date("2026-08-10T20:00:00.000Z"),
        moduleHours: 12,
        absenceReasonId: otrosReason.id,
        observation: "Trámite personal urgente",
        bajoFactura: false,
      },
      {
        date: new Date("2026-08-12T08:00:00.000Z"),
        requesterStart: new Date("2026-08-12T08:00:00.000Z"),
        requesterEnd: new Date("2026-08-12T20:00:00.000Z"),
        moduleHours: 12,
        absenceReasonId: vacacionesReason.id,
        observation: null,
        bajoFactura: false,
      },
    ];

    for (const data of seedShifts) {
      const existingShift = await prisma.shiftReplacement.findFirst({
        where: {
          requesterId: requesterForSeed.id,
          requesterStart: data.requesterStart,
        },
      });

      if (!existingShift) {
        await prisma.shiftReplacement.create({
          data: {
            ...data,
            requesterId: requesterForSeed.id,
            specialtyId: pediatria.id,
            state: "CONFIRMED",
            resolvedById: (
              await prisma.user.findUnique({
                where: { email: coordinatorEmail },
              })
            )?.id,
          },
        });
      }
    }
    console.log(`✓ ${seedShifts.length} reemplazos demo asegurados para RRHH`);
  } else {
    console.warn(
      "⚠ No se pudieron crear los reemplazos demo (faltan usuarios o motivos base)",
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e: unknown) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
