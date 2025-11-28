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
    "wit" INTEGER NOT NULL,
    "discipline" INTEGER NOT NULL,
    "charisma" INTEGER NOT NULL,
    "leadership" INTEGER NOT NULL,
    "empathy" INTEGER NOT NULL,
    "strength" INTEGER NOT NULL,
    "athleticism" INTEGER NOT NULL,
    "endurance" INTEGER NOT NULL,
    "isAlive" BOOLEAN NOT NULL DEFAULT true,
    "isPlayer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Person_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Person_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Person" ("age", "athleticism", "birthYear", "charisma", "countryId", "createdAt", "discipline", "empathy", "endurance", "id", "intelligence", "isAlive", "leadership", "name", "strength", "wit", "worldId") SELECT "age", "athleticism", "birthYear", "charisma", "countryId", "createdAt", "discipline", "empathy", "endurance", "id", "intelligence", "isAlive", "leadership", "name", "strength", "wit", "worldId" FROM "Person";
DROP TABLE "Person";
ALTER TABLE "new_Person" RENAME TO "Person";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
