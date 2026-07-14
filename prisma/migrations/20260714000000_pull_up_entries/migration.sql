CREATE TABLE "pull_up_entries" (
  "id" SERIAL NOT NULL,
  "date" DATE NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "pull_up_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pull_up_entries_date_key" UNIQUE ("date"),
  CONSTRAINT "pull_up_entries_count_check" CHECK ("count" >= 0)
);
