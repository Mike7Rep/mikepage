CREATE TABLE "pull_up_challenges" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "target_count" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "target_date" DATE NOT NULL,
    "start_day_count" INTEGER NOT NULL DEFAULT 0,
    "end_date" DATE,
    "end_day_count" INTEGER,
    "final_count" INTEGER,
    "closed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pull_up_challenges_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pull_up_challenges_target_count_check" CHECK ("target_count" > 0),
    CONSTRAINT "pull_up_challenges_date_order_check" CHECK ("target_date" >= "start_date"),
    CONSTRAINT "pull_up_challenges_counts_check" CHECK (
        "start_day_count" >= 0
        AND ("end_day_count" IS NULL OR "end_day_count" >= 0)
        AND ("final_count" IS NULL OR "final_count" >= 0)
    )
);

CREATE INDEX "pull_up_challenges_closed_at_target_date_idx"
ON "pull_up_challenges"("closed_at", "target_date");

CREATE UNIQUE INDEX "pull_up_challenges_single_active_idx"
ON "pull_up_challenges" ((1))
WHERE "closed_at" IS NULL;
