create table "google_health_connections" (
  "id" integer primary key default 1,
  "refresh_token_ciphertext" text not null,
  "refresh_token_expires_at" timestamptz(3),
  "granted_scopes" text not null default '',
  "last_synced_at" timestamptz(3),
  "backfill_before" timestamptz(3),
  "connected_at" timestamptz(3) not null default current_timestamp,
  "updated_at" timestamptz(3) not null,
  constraint "google_health_connections_single_row" check ("id" = 1)
);

create table "heart_rate_samples" (
  "id" serial primary key,
  "measured_at" timestamptz(3) not null,
  "beats_per_minute" integer not null,
  "created_at" timestamptz(3) not null default current_timestamp,
  constraint "heart_rate_samples_bpm_range" check ("beats_per_minute" > 0 and "beats_per_minute" <= 400)
);

create unique index "heart_rate_samples_measured_at_key"
  on "heart_rate_samples"("measured_at");
