import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ 
      status: "healthy", 
      uptime: process.uptime(),
      timestamp: Date.now() 
    }),
    {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
};
