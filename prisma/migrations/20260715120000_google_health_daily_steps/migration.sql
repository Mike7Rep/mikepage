create table "daily_step_counts" (
  "date" date primary key,
  "steps" integer not null,
  "updated_at" timestamptz(3) not null,
  constraint "daily_step_counts_steps_nonnegative" check ("steps" >= 0)
);
