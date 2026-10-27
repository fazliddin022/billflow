import type { Config } from "drizzle-kit";
export default {
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_zgGaA5rotf0q@ep-cold-fog-ao38qqct-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  },
} satisfies Config;