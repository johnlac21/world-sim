-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Term" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "officeId" INTEGER NOT NULL,
    "personId" INTEGER NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER,
    "playerLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Term_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Term_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Term" ("createdAt", "endYear", "id", "officeId", "personId", "startYear") SELECT "createdAt", "endYear", "id", "officeId", "personId", "startYear" FROM "Term";
DROP TABLE "Term";
ALTER TABLE "new_Term" RENAME TO "Term";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
