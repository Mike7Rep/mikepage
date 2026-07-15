CREATE TABLE "google_health_sleep_intervals" (
    "id" SERIAL NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL,
    "ended_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "google_health_sleep_intervals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "google_health_sleep_intervals_started_at_ended_at_key"
ON "google_health_sleep_intervals"("started_at", "ended_at");

CREATE INDEX "google_health_sleep_intervals_ended_at_idx"
ON "google_health_sleep_intervals"("ended_at");
