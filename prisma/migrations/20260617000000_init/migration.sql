CREATE TABLE "wealth_snapshots" (
    "id" SERIAL NOT NULL,
    "week_key" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CHF',
    "total" DECIMAL(12,2) NOT NULL,
    "savings" DECIMAL(12,2) NOT NULL,
    "cash_reserve" DECIMAL(12,2) NOT NULL,
    "investments" DECIMAL(12,2) NOT NULL,
    "mintos" DECIMAL(12,2) NOT NULL,
    "bondora" DECIMAL(12,2) NOT NULL,
    "alpaca" DECIMAL(12,2) NOT NULL,
    "bank_account" DECIMAL(12,2) NOT NULL,
    "card" DECIMAL(12,2) NOT NULL,
    "legacy_degiro" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wealth_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "asset_price_bars" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "open" DECIMAL(18,6) NOT NULL,
    "high" DECIMAL(18,6) NOT NULL,
    "low" DECIMAL(18,6) NOT NULL,
    "close" DECIMAL(18,6) NOT NULL,
    "volume" DECIMAL(20,2) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'alpaca',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asset_price_bars_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "runs" (
    "id" SERIAL NOT NULL,
    "run_date" DATE NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    CONSTRAINT "runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "run_id" INTEGER,
    "symbol" TEXT NOT NULL,
    "analysis_json" JSONB NOT NULL,
    "decision_json" JSONB NOT NULL,
    "order_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wealth_snapshots_week_key_key" ON "wealth_snapshots"("week_key");
CREATE INDEX "wealth_snapshots_year_week_idx" ON "wealth_snapshots"("year", "week");
CREATE UNIQUE INDEX "asset_price_bars_symbol_date_key" ON "asset_price_bars"("symbol", "date");
CREATE INDEX "asset_price_bars_symbol_date_idx" ON "asset_price_bars"("symbol", "date");
CREATE UNIQUE INDEX "runs_run_date_kind_key" ON "runs"("run_date", "kind");
CREATE INDEX "reviews_run_id_idx" ON "reviews"("run_id");
CREATE INDEX "reviews_created_at_idx" ON "reviews"("created_at");
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
