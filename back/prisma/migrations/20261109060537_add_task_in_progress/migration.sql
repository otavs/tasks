-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "day" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "time" INTEGER NOT NULL DEFAULT 540,
    "position" INTEGER NOT NULL,
    "inProgress" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Task" ("day", "id", "month", "position", "time", "title", "year") SELECT "day", "id", "month", "position", "time", "title", "year" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
