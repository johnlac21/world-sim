-- CreateTable
CREATE TABLE "CountryYearPerformance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "worldId" INTEGER NOT NULL,
    "countryId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "companyScore" REAL NOT NULL DEFAULT 0,
    "governmentScore" REAL NOT NULL DEFAULT 0,
    "populationScore" REAL NOT NULL DEFAULT 0,
    "totalScore" REAL NOT NULL DEFAULT 0,
    "isChampion" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CountryYearPerformance_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CountryYearPerformance_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CountryYearPerformance_worldId_year_idx" ON "CountryYearPerformance"("worldId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "CountryYearPerformance_worldId_countryId_year_key" ON "CountryYearPerformance"("worldId", "countryId", "year");
