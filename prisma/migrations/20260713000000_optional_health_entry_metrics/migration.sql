ALTER TABLE "health_entries"
  ALTER COLUMN "blood_pressure_1" DROP NOT NULL,
  ALTER COLUMN "blood_pressure_2" DROP NOT NULL,
  ALTER COLUMN "waist_cm" DROP NOT NULL;
