import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { defineConfig } from "prisma/config";


// CLI（マイグレーション実行など）が使用するURL
// ローカルからの実行時は外部接続用の MIGRATION_DATABASE_URL を優先する
const migrationUrl = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl,
  },
});
