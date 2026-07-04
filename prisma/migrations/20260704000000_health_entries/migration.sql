create table "health_entries" (
  "id" serial primary key,
  "date" date not null unique,
  "blood_pressure_1" integer not null,
  "blood_pressure_2" integer not null,
  "waist_cm" decimal(5, 1) not null,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null
);

create index "health_entries_date_idx" on "health_entries"("date");
