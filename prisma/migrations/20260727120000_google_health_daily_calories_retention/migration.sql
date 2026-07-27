create table "daily_calorie_burns" (
  "date" date primary key,
  "kilocalories" integer not null,
  "updated_at" timestamptz(3) not null,
  constraint "daily_calorie_burns_range" check ("kilocalories" >= 0 and "kilocalories" <= 100000)
);

delete from "health_entries"
where "date" < current_date - interval '1 year';

delete from "heart_rate_samples"
where "measured_at" < current_timestamp - interval '1 year';

delete from "daily_step_counts"
where "date" < current_date - interval '1 year';

delete from "daily_resting_heart_rates"
where "date" < current_date - interval '1 year';

delete from "google_health_sleep_intervals"
where "ended_at" < current_timestamp - interval '1 year';

delete from "withings_measurements"
where "measured_at" < current_timestamp - interval '1 year';
