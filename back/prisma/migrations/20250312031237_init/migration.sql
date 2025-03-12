-- CreateTable
CREATE TABLE "Task" (
    "day" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    PRIMARY KEY ("day", "month", "year")
);
