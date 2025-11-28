/*
  Warnings:

  - You are about to drop the column `wit` on the `Person` table. All the data in the column will be lost.
  - Added the required column `adaptability` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `agreeableness` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ambition` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `appearance` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `communication` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `confidence` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creativity` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `integrity` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `judgment` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `memory` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `negotiation` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patience` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reflexes` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `riskTaking` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stability` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vitality` to the `Person` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Person" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "worldId" INTEGER NOT NULL,
    "countryId" INTEGER,
    "name" TEXT NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "age" INTEGER NOT NULL,
    "intelligence" INTEGER NOT NULL,
    "memory" INTEGER NOT NULL,
    "creativity" INTEGER NOT NULL,
    "discipline" INTEGER NOT NULL,
    "judgment" INTEGER NOT NULL,
    "adaptability" INTEGER NOT NULL,
    "charisma" INTEGER NOT NULL,
    "leadership" INTEGER NOT NULL,
    "empathy" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "negotiation" INTEGER NOT NULL,
    "strength" INTEGER NOT NULL,
    "endurance" INTEGER NOT NULL,
    "athleticism" INTEGER NOT NULL,
    "vitality" INTEGER NOT NULL,
    "reflexes" INTEGER NOT NULL,
    "appearance" INTEGER NOT NULL,
    "ambition" INTEGER NOT NULL,
    "integrity" INTEGER NOT NULL,
    "riskTaking" INTEGER NOT NULL,
    "patience" INTEGER NOT NULL,
    "agreeableness" INTEGER NOT NULL,
    "stability" INTEGER NOT NULL,
    "isAlive" BOOLEAN NOT NULL DEFAULT true,
    "isPlayer" BOOLEAN NOT NULL DEFAULT false,
    "parent1Id" INTEGER,
    "parent2Id" INTEGER,
    "prestige" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Person_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Person_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Person_parent1Id_fkey" FOREIGN KEY ("parent1Id") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Person_parent2Id_fkey" FOREIGN KEY ("parent2Id") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Person" ("age", "athleticism", "birthYear", "charisma", "countryId", "createdAt", "discipline", "empathy", "endurance", "id", "intelligence", "isAlive", "isPlayer", "leadership", "name", "parent1Id", "parent2Id", "prestige", "strength", "worldId") SELECT "age", "athleticism", "birthYear", "charisma", "countryId", "createdAt", "discipline", "empathy", "endurance", "id", "intelligence", "isAlive", "isPlayer", "leadership", "name", "parent1Id", "parent2Id", "prestige", "strength", "worldId" FROM "Person";
DROP TABLE "Person";
ALTER TABLE "new_Person" RENAME TO "Person";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
