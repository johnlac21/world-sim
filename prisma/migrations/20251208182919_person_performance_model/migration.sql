-- CreateTable
CREATE TABLE "PersonYearPerformance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "worldId" INTEGER NOT NULL,
    "personId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "industry" TEXT NOT NULL,
    "talentScore" REAL NOT NULL,
    "leadershipScore" REAL NOT NULL,
    "reliabilityScore" REAL NOT NULL,
    "contributionScore" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonYearPerformance_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PersonYearPerformance_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PersonYearPerformance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PersonYearPerformance_worldId_year_idx" ON "PersonYearPerformance"("worldId", "year");

-- CreateIndex
CREATE INDEX "PersonYearPerformance_companyId_year_idx" ON "PersonYearPerformance"("companyId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "PersonYearPerformance_worldId_personId_year_key" ON "PersonYearPerformance"("worldId", "personId", "year");
