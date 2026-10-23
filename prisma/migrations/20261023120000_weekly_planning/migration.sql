CREATE TABLE "planning_weeks" (
    "week" TEXT NOT NULL,
    "tasks" JSONB NOT NULL,
    "score" INTEGER,
    "total" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "planning_weeks_pkey" PRIMARY KEY ("week")
);
