import argon2 from "argon2";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// ── Self-contained constants (no src/modules imports) ─────────────────
// The seed must run inside the Docker container where src/modules does not
// exist.  Define the Role enum and the default absence-reasons list here
// so the script is fully self-contained.

const Role = {
  BASE_PROFESSIONAL: "BASE_PROFESSIONAL",
  COORDINATOR: "COORDINATOR",
  RRHH: "RRHH",
} as const;

interface DefaultAbsenceReason {
  name: string;
  isDefault: boolean;
  isActive: boolean;
}

const defaultAbsenceReasons: readonly DefaultAbsenceReason[] = [
  { name: "Motivos Personales", isDefault: true, isActive: true },
  { name: "Vacaciones", isDefault: true, isActive: true },
  { name: "Cambio de guardia", isDefault: true, isActive: true },
  { name: "Congresos", isDefault: true, isActive: true },
];

// ── Bootstrap ─────────────────────────────────────────────────────────

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  // 1. Coordinator (required before any other user can be activated).
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

  // 2. Specialties.
  const specialties = ["Pediatría", "Emergentología", "Clínica Médica", "Cirugía"];
  for (const name of specialties) {
    await prisma.specialty.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✓ Especialidades base aseguradas: ${specialties.join(", ")}`);

  // 3. Default absence reasons (protected — may be renamed/deactivated, never deleted).
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

  // 4. Custom reason "Otros" — used to test obligatory observation flow.
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

  // 5. Demo professionals (active, with specialties).
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

  // 6. RRHH demo user — active, BASE_PROFESSIONAL; coordinator promotes via /users.
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

  // 7. Sample shift replacements for RRHH dashboard + export.
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

  // 8. Backfill motives on legacy CONFIRMED shifts with null absenceReasonId.
  const backfillReasonNames = [
    "Motivos Personales",
    "Vacaciones",
    "Cambio de guardia",
    "Congresos",
    "Otros",
  ] as const;

  const backfillReasons = new Map<string, string>();
  for (const name of backfillReasonNames) {
    const reason = await prisma.absenceReason.findUnique({ where: { name } });
    if (reason) backfillReasons.set(name, reason.id);
  }

  const pendingShifts = await prisma.shiftReplacement.findMany({
    where: { state: "CONFIRMED", absenceReasonId: null },
    orderBy: { id: "asc" },
  });

  let backfilled = 0;
  for (let i = 0; i < pendingShifts.length; i++) {
    const shift = pendingShifts[i];
    const reasonName = backfillReasonNames[i % backfillReasonNames.length];
    const reasonId = backfillReasons.get(reasonName);
    if (!reasonId) continue;

    await prisma.shiftReplacement.update({
      where: { id: shift.id },
      data: {
        absenceReasonId: reasonId,
        observation: reasonName === "Otros" ? "Motivo demo" : null,
      },
    });
    backfilled++;
  }
  console.log(
    `✓ Motivos backfilled en ${backfilled} reemplazo(s) CONFIRMED legacy sin motivo`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e: unknown) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
