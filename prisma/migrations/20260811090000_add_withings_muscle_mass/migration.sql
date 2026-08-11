ALTER TABLE "health_goals"
ADD COLUMN "muscle_mass_kg" DECIMAL(5, 1);

ALTER TABLE "withings_measurements"
ADD COLUMN "muscle_mass_kg" DECIMAL(6, 3);

ALTER TABLE "withings_measurements"
ADD CONSTRAINT "withings_measurements_muscle_mass_range"
CHECK (
  "muscle_mass_kg" IS NULL
  OR ("muscle_mass_kg" > 0 AND "muscle_mass_kg" <= 600)
);

UPDATE "withings_connections"
SET "last_update" = NULL,
    "last_synced_at" = NULL;
