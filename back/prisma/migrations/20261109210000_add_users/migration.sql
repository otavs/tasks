-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tasks and recurrences from before logins existed go to a placeholder account nobody can log into ("#legacy" isn't a
-- valid username). The first user created takes it over (see src/endpoints/admin/createUser.ts).
INSERT INTO "User" ("username")
SELECT '#legacy' WHERE EXISTS (SELECT 1 FROM "Task") OR EXISTS (SELECT 1 FROM "Recurrence");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Recurrence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "weekdays" INTEGER NOT NULL DEFAULT 127,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Recurrence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Recurrence" ("enabled", "id", "name", "userId", "weekdays")
SELECT "enabled", "id", "name", (SELECT "id" FROM "User" WHERE "username" = '#legacy'), "weekdays" FROM "Recurrence";
DROP TABLE "Recurrence";
ALTER TABLE "new_Recurrence" RENAME TO "Recurrence";
CREATE INDEX "Recurrence_userId_idx" ON "Recurrence"("userId");
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "time" INTEGER NOT NULL DEFAULT 540,
    "position" INTEGER NOT NULL,
    "inProgress" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'task',
    "recurrenceId" INTEGER,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_recurrenceId_fkey" FOREIGN KEY ("recurrenceId") REFERENCES "Recurrence" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("day", "id", "inProgress", "month", "position", "recurrenceId", "time", "title", "type", "userId", "year")
SELECT "day", "id", "inProgress", "month", "position", "recurrenceId", "time", "title", "type", (SELECT "id" FROM "User" WHERE "username" = '#legacy'), "year" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_userId_year_month_day_idx" ON "Task"("userId", "year", "month", "day");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
