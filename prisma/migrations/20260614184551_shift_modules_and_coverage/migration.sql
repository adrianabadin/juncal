/*
  Warnings:

  - You are about to drop the column `applicantId` on the `ShiftReplacement` table. All the data in the column will be lost.
  - Added the required column `moduleHours` to the `ShiftReplacement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requesterEnd` to the `ShiftReplacement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requesterStart` to the `ShiftReplacement` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ShiftCoverage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shiftReplacementId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'POSTULATION',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShiftCoverage_shiftReplacementId_fkey" FOREIGN KEY ("shiftReplacementId") REFERENCES "ShiftReplacement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShiftCoverage_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShiftReplacement_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShiftReplacement_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ShiftReplacement_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ShiftReplacement" ("createdAt", "date", "id", "requesterId", "resolvedById", "specialtyId", "state", "updatedAt") SELECT "createdAt", "date", "id", "requesterId", "resolvedById", "specialtyId", "state", "updatedAt" FROM "ShiftReplacement";
DROP TABLE "ShiftReplacement";
ALTER TABLE "new_ShiftReplacement" RENAME TO "ShiftReplacement";
CREATE INDEX "ShiftReplacement_state_specialtyId_idx" ON "ShiftReplacement"("state", "specialtyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ShiftCoverage_shiftReplacementId_idx" ON "ShiftCoverage"("shiftReplacementId");
