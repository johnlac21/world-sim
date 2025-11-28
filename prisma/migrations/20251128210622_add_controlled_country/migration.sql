-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_World" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "currentYear" INTEGER NOT NULL DEFAULT 0,
    "controlledCountryId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "World_controlledCountryId_fkey" FOREIGN KEY ("controlledCountryId") REFERENCES "Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_World" ("createdAt", "currentYear", "id", "name") SELECT "createdAt", "currentYear", "id", "name" FROM "World";
DROP TABLE "World";
ALTER TABLE "new_World" RENAME TO "World";
CREATE UNIQUE INDEX "World_controlledCountryId_key" ON "World"("controlledCountryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
