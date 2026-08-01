alter table "health_entries" drop column if exists "pulse";
alter table "health_goals" drop column if exists "pulse";
alter table "google_health_connections" drop column if exists "backfill_before";

drop table if exists "heart_rate_samples";
drop table if exists "daily_resting_heart_rates";

create table "daily_calorie_intakes" (
  "date" date primary key,
  "kilocalories" integer not null,
  "updated_at" timestamptz(3) not null default current_timestamp,
  constraint "daily_calorie_intakes_range"
    check ("kilocalories" >= 0 and "kilocalories" <= 100000)
);
