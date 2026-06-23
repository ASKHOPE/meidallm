import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { dash } from "@better-auth/infra";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("❌ ERROR: DATABASE_URL is not set in your .env file!");
  process.exit(1);
}

// Initialize PG Connection Pool
const dbPool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false // Required for Aiven serverless DB connections
  }
});

// Configure Better Auth options
export const auth = betterAuth({
  database: dbPool,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true
  },
  plugins: [
    dash()
  ]
});
