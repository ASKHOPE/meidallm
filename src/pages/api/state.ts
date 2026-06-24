import type { APIRoute } from "astro";
import { dbPool } from "../../../auth";

// Automatically run table creation
async function initDb() {
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS user_state (
      email TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
initDb().catch(e => console.error("Failed to initialize state table:", e));

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  
  if (!email) {
    return new Response(JSON.stringify({ error: "Missing email parameter" }), { status: 400 });
  }

  try {
    const res = await dbPool.query("SELECT state_json FROM user_state WHERE email = $1", [email]);
    if (res.rows.length > 0) {
      return new Response(res.rows[0].state_json, {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ message: "No state found" }), { status: 404 });
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, state } = body;

    if (!email || !state) {
      return new Response(JSON.stringify({ error: "Missing email or state" }), { status: 400 });
    }

    await dbPool.query(
      `INSERT INTO user_state (email, state_json, updated_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP) 
       ON CONFLICT (email) 
       DO UPDATE SET state_json = EXCLUDED.state_json, updated_at = CURRENT_TIMESTAMP`,
      [email, JSON.stringify(state)]
    );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
