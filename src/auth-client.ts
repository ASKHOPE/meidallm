import { createAuthClient } from "better-auth/client";
import { sentinelClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  baseURL: window.location.origin, // Points to frontend origin (Vite), which proxies to Bun server
  plugins: [
    sentinelClient()
  ]
});
