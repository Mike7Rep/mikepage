CREATE TABLE "investment_assets" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "total_value" DECIMAL(12,2),
    "share_percent" DECIMAL(7,4),
    "valuation_date" DATE,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "investment_assets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "investment_assets_sort_order_idx" ON "investment_assets"("sort_order");
