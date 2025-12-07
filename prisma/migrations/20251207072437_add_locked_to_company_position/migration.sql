-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CompanyPosition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "personId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyPosition_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CompanyPosition_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CompanyPosition_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "IndustryRole" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CompanyPosition" ("companyId", "createdAt", "endYear", "id", "personId", "roleId", "startYear") SELECT "companyId", "createdAt", "endYear", "id", "personId", "roleId", "startYear" FROM "CompanyPosition";
DROP TABLE "CompanyPosition";
ALTER TABLE "new_CompanyPosition" RENAME TO "CompanyPosition";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
