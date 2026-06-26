-- CreateTable (AbsenceReason must exist before ShiftReplacement FK references it)
CREATE TABLE IF NOT EXISTS "AbsenceReason" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "AbsenceReason_name_key" ON "AbsenceReason"("name");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShiftReplacement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'OPEN',
    "requesterId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "moduleHours" INTEGER NOT NULL,
    "requesterStart" DATETIME NOT NULL,
    "requesterEnd" DATETIME NOT NULL,
    "resolvedById" TEXT,
    "absenceReasonId" TEXT,
    "observation" TEXT,
    "bajoFactura" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShiftReplacement_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShiftReplacement_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ShiftReplacement_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShiftReplacement_absenceReasonId_fkey" FOREIGN KEY ("absenceReasonId") REFERENCES "AbsenceReason" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ShiftReplacement" ("absenceReasonId", "createdAt", "date", "id", "moduleHours", "observation", "requesterEnd", "requesterId", "requesterStart", "resolvedById", "specialtyId", "state", "updatedAt") SELECT "absenceReasonId", "createdAt", "date", "id", "moduleHours", "observation", "requesterEnd", "requesterId", "requesterStart", "resolvedById", "specialtyId", "state", "updatedAt" FROM "ShiftReplacement";
DROP TABLE "ShiftReplacement";
ALTER TABLE "new_ShiftReplacement" RENAME TO "ShiftReplacement";
CREATE INDEX "ShiftReplacement_state_specialtyId_idx" ON "ShiftReplacement"("state", "specialtyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Adjust default absence reasons (spec AR-2, AR-5).
-- Deactivate legacy defaults without deleting them: existing ShiftReplacement
-- records that reference "Enfermedad"/"Otros" remain valid and still display the
-- stored reason name (spec AR-6).
UPDATE "AbsenceReason" SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" IN ('Enfermedad', 'Otros');

-- Seed the new active default reasons if they do not already exist.
INSERT INTO "AbsenceReason" ("id", "name", "isDefault", "isActive", "createdAt", "updatedAt")
SELECT 'ar_cambio_de_guardia', 'Cambio de guardia', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "AbsenceReason" WHERE "name" = 'Cambio de guardia');

INSERT INTO "AbsenceReason" ("id", "name", "isDefault", "isActive", "createdAt", "updatedAt")
SELECT 'ar_congresos', 'Congresos', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "AbsenceReason" WHERE "name" = 'Congresos');
