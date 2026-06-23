import { betterAuth } from "better-auth";
import pg from "pg";
import { parse } from "pg-connection-string";
import { dash } from "@better-auth/infra";

// Ensure Node process.env has our API and Secret keys in local Vite/Astro dev
if (typeof import.meta !== 'undefined' && import.meta.env) {
  if (!process.env.BETTER_AUTH_API_KEY) process.env.BETTER_AUTH_API_KEY = import.meta.env.BETTER_AUTH_API_KEY;
  if (!process.env.BETTER_AUTH_SECRET) process.env.BETTER_AUTH_SECRET = import.meta.env.BETTER_AUTH_SECRET;
}

// Support both Node process.env (production/CLI) and Astro import.meta.env (local Vite dev)
const databaseUrl = process.env.DATABASE_URL || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.DATABASE_URL : undefined);

if (!databaseUrl) {
  console.error("❌ ERROR: DATABASE_URL is not set in your .env or environment!");
  process.exit(1);
}

// Parse connection URL to ensure SSL parameters are properly overridden
const connectionConfig = parse(databaseUrl);

const dbPool = new pg.Pool({
  host: connectionConfig.host || undefined,
  port: connectionConfig.port ? parseInt(connectionConfig.port, 10) : undefined,
  database: connectionConfig.database || undefined,
  user: connectionConfig.user || undefined,
  password: connectionConfig.password || undefined,
  ssl: {
    rejectUnauthorized: false // Required for Aiven serverless DB connections
  }
});

const getBaseURL = () => {
  const envUrl = process.env.BETTER_AUTH_URL || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.BETTER_AUTH_URL : undefined);
  if (envUrl) return envUrl;
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  return "http://localhost:4321";
};

// Configure Better Auth options
export const auth = betterAuth({
  database: dbPool,
  baseURL: getBaseURL(),
  emailAndPassword: {
    enabled: true
  },
  plugins: [
    dash()
  ]
});
