create table "daily_resting_heart_rates" (
  "date" date primary key,
  "beats_per_minute" integer not null,
  "updated_at" timestamptz(3) not null,
  constraint "daily_resting_heart_rates_bpm_range"
    check ("beats_per_minute" > 0 and "beats_per_minute" <= 400)
);
