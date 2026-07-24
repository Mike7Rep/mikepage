CREATE TABLE "withings_connections" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "user_id" BIGINT NOT NULL,
  "access_token_ciphertext" TEXT NOT NULL,
  "access_token_expires_at" TIMESTAMPTZ(3) NOT NULL,
  "refresh_token_ciphertext" TEXT NOT NULL,
  "refresh_token_expires_at" TIMESTAMPTZ(3) NOT NULL,
  "granted_scopes" TEXT NOT NULL DEFAULT '',
  "last_update" BIGINT,
  "last_synced_at" TIMESTAMPTZ(3),
  "connected_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "withings_connections_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "withings_connections_single_row" CHECK ("id" = 1)
);

CREATE UNIQUE INDEX "withings_connections_user_id_key"
ON "withings_connections"("user_id");

CREATE TABLE "withings_measurements" (
  "group_id" BIGINT NOT NULL,
  "measured_at" TIMESTAMPTZ(3) NOT NULL,
  "weight_kg" DECIMAL(6, 3),
  "body_fat_percent" DECIMAL(5, 2),
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "modified_at" TIMESTAMPTZ(3),
  "device_id" TEXT,
  "model" TEXT,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "withings_measurements_pkey" PRIMARY KEY ("group_id"),
  CONSTRAINT "withings_measurements_weight_range"
    CHECK ("weight_kg" IS NULL OR ("weight_kg" > 0 AND "weight_kg" <= 600)),
  CONSTRAINT "withings_measurements_body_fat_range"
    CHECK ("body_fat_percent" IS NULL OR ("body_fat_percent" >= 0 AND "body_fat_percent" <= 100))
);

CREATE INDEX "withings_measurements_is_deleted_measured_at_group_id_idx"
ON "withings_measurements"("is_deleted", "measured_at", "group_id");
