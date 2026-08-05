CREATE TABLE "google_health_runs" (
    "id" SERIAL NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL,
    "ended_at" TIMESTAMPTZ(3) NOT NULL,
    "active_seconds" INTEGER NOT NULL,
    "distance_km" DECIMAL(8,3) NOT NULL,
    "average_heart_rate" DECIMAL(5,1),
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "google_health_runs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "google_health_runs_active_seconds_check" CHECK ("active_seconds" > 0),
    CONSTRAINT "google_health_runs_distance_check" CHECK ("distance_km" > 0),
    CONSTRAINT "google_health_runs_heart_rate_check" CHECK ("average_heart_rate" IS NULL OR "average_heart_rate" > 0),
    CONSTRAINT "google_health_runs_interval_check" CHECK ("ended_at" > "started_at")
);

CREATE UNIQUE INDEX "google_health_runs_started_at_ended_at_key"
ON "google_health_runs"("started_at", "ended_at");

CREATE INDEX "google_health_runs_ended_at_idx"
ON "google_health_runs"("ended_at");
