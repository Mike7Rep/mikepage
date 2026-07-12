ALTER TABLE "health_entries"
  ADD COLUMN "body_fat_percent" DECIMAL(4, 1),
  ADD COLUMN "weight_kg" DECIMAL(5, 1),
  ADD COLUMN "pulse" INTEGER;

CREATE TABLE "health_goals" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "blood_pressure_1" INTEGER,
  "blood_pressure_2" INTEGER,
  "waist_cm" DECIMAL(5, 1),
  "body_fat_percent" DECIMAL(4, 1),
  "weight_kg" DECIMAL(5, 1),
  "pulse" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "health_goals_pkey" PRIMARY KEY ("id")
);
