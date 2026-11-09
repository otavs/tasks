-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RecurrenceItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recurrenceId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "time" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'task',
    CONSTRAINT "RecurrenceItem_recurrenceId_fkey" FOREIGN KEY ("recurrenceId") REFERENCES "Recurrence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RecurrenceItem" ("id", "recurrenceId", "time", "title") SELECT "id", "recurrenceId", "time", "title" FROM "RecurrenceItem";
DROP TABLE "RecurrenceItem";
ALTER TABLE "new_RecurrenceItem" RENAME TO "RecurrenceItem";
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "day" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "time" INTEGER NOT NULL DEFAULT 540,
    "position" INTEGER NOT NULL,
    "inProgress" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'task',
    "recurrenceId" INTEGER,
    CONSTRAINT "Task_recurrenceId_fkey" FOREIGN KEY ("recurrenceId") REFERENCES "Recurrence" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("day", "id", "inProgress", "month", "position", "recurrenceId", "time", "title", "year") SELECT "day", "id", "inProgress", "month", "position", "recurrenceId", "time", "title", "year" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
