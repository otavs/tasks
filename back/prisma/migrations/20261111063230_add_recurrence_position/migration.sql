-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Recurrence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "weekdays" INTEGER NOT NULL DEFAULT 127,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Recurrence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Existing recurrences keep the order they had (by id).
INSERT INTO "new_Recurrence" ("enabled", "id", "name", "userId", "weekdays", "position") SELECT "enabled", "id", "name", "userId", "weekdays", "id" FROM "Recurrence";
DROP TABLE "Recurrence";
ALTER TABLE "new_Recurrence" RENAME TO "Recurrence";
CREATE INDEX "Recurrence_userId_idx" ON "Recurrence"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
