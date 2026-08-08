import { config } from "dotenv"
import { defineConfig } from "prisma/config"

config({ path: [".env.local", ".env"] })

const url = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!url) {
  throw new Error("DIRECT_URL oder DATABASE_URL fehlt. Hinterlege die Railway-URL in .env.local.")
}

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
