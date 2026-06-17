import "dotenv/config"
import { defineConfig } from "prisma/config"

const url =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://mikepage:mikepage@localhost:5432/mikepage"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url,
  },
})
