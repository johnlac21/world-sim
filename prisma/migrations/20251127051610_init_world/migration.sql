-- CreateTable
CREATE TABLE "World" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "currentYear" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Country" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "worldId" INTEGER NOT NULL,
    CONSTRAINT "Country_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Person" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Person_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Person_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
