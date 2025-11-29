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
    "potentialOverall" INTEGER NOT NULL DEFAULT 60,
    "peakAge" INTEGER NOT NULL DEFAULT 35,
    "developmentStyle" TEXT NOT NULL DEFAULT 'NORMAL',
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
INSERT INTO "new_Person" ("adaptability", "age", "agreeableness", "ambition", "appearance", "athleticism", "birthYear", "charisma", "communication", "confidence", "countryId", "createdAt", "creativity", "discipline", "empathy", "endurance", "id", "integrity", "intelligence", "isAlive", "isPlayer", "judgment", "leadership", "memory", "name", "negotiation", "parent1Id", "parent2Id", "patience", "prestige", "reflexes", "riskTaking", "stability", "strength", "vitality", "worldId") SELECT "adaptability", "age", "agreeableness", "ambition", "appearance", "athleticism", "birthYear", "charisma", "communication", "confidence", "countryId", "createdAt", "creativity", "discipline", "empathy", "endurance", "id", "integrity", "intelligence", "isAlive", "isPlayer", "judgment", "leadership", "memory", "name", "negotiation", "parent1Id", "parent2Id", "patience", "prestige", "reflexes", "riskTaking", "stability", "strength", "vitality", "worldId" FROM "Person";
DROP TABLE "Person";
ALTER TABLE "new_Person" RENAME TO "Person";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
