-- AlterTable
ALTER TABLE "runs" ADD COLUMN     "account_key" TEXT,
ADD COLUMN     "state_json" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "depot_snapshots" (
    "account_key" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "equity" DECIMAL(20,6) NOT NULL,
    "capital" DECIMAL(20,6),
    "cash" DECIMAL(20,6),
    "market_value" DECIMAL(20,6),
    "cost_basis" DECIMAL(20,6),
    "positions" JSONB,
    "observed_at" TIMESTAMPTZ(3),
    "currency" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "depot_snapshots_pkey" PRIMARY KEY ("account_key","date")
);

-- CreateTable
CREATE TABLE "depot_activities" (
    "account_key" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "depot_activities_pkey" PRIMARY KEY ("account_key","activity_id")
);

-- CreateTable
CREATE TABLE "depot_orders" (
    "id" TEXT NOT NULL,
    "account_key" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "qty" DECIMAL(24,9) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'preview',
    "data" JSONB NOT NULL DEFAULT '{}',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "depot_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "depot_activities_account_key_date_idx" ON "depot_activities"("account_key", "date");

-- CreateIndex
CREATE INDEX "depot_orders_account_key_created_at_idx" ON "depot_orders"("account_key", "created_at");

-- CreateIndex
CREATE INDEX "runs_account_key_created_at_idx" ON "runs"("account_key", "created_at");

