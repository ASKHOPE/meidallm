import type { APIRoute } from "astro";
import { dbPool } from "../../../auth";

// Automatically run table creation
async function initDb() {
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      email TEXT PRIMARY KEY,
      active_org_id TEXT NOT NULL,
      theme TEXT DEFAULT 'night',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS organization_state (
      org_id TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
initDb().catch(e => console.error("Failed to initialize state tables:", e));

// Helper to get default Org ID from email
function getDefaultOrg(email: string): string {
  const parts = email.split("@");
  if (parts.length === 2) {
    const domain = parts[1].toLowerCase();
    // Exclude generic mail domains to give personal orgs
    const genericDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "aol.com"];
    if (!genericDomains.includes(domain)) {
      return domain;
    }
  }
  return `personal-${parts[0].replace(/[^a-zA-Z0-9]/g, "-")}`;
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  const queryOrgId = url.searchParams.get("orgId");
  
  if (!email) {
    return new Response(JSON.stringify({ error: "Missing email parameter" }), { status: 400 });
  }

  try {
    // 1. Get user preferences or set via queryOrgId
    let prefsRes = await dbPool.query("SELECT active_org_id, theme FROM user_preferences WHERE email = $1", [email]);
    let activeOrgId = "";
    let theme = "day";

    if (queryOrgId) {
      activeOrgId = queryOrgId;
      theme = prefsRes.rows.length > 0 ? prefsRes.rows[0].theme : "day";
      await dbPool.query(
        `INSERT INTO user_preferences (email, active_org_id, theme, updated_at) 
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
         ON CONFLICT (email) 
         DO UPDATE SET active_org_id = EXCLUDED.active_org_id, updated_at = CURRENT_TIMESTAMP`,
        [email, queryOrgId, theme]
      );
    } else if (prefsRes.rows.length > 0) {
      activeOrgId = prefsRes.rows[0].active_org_id;
      theme = prefsRes.rows[0].theme;
    } else {
      activeOrgId = getDefaultOrg(email);
      // Auto create default preferences record
      await dbPool.query(
        "INSERT INTO user_preferences (email, active_org_id, theme) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        [email, activeOrgId, theme]
      );
    }

    // 2. Query Org State
    const stateRes = await dbPool.query("SELECT state_json FROM organization_state WHERE org_id = $1", [activeOrgId]);
    
    if (stateRes.rows.length > 0) {
      return new Response(
        JSON.stringify({
          userPrefs: { activeOrgId, theme },
          orgState: JSON.parse(stateRes.rows[0].state_json)
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } else {
      // Return 404 indicating no organization state exists yet (will trigger client seed upload)
      return new Response(
        JSON.stringify({ 
          message: "No organization state found",
          userPrefs: { activeOrgId, theme } 
        }), 
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, orgId, theme, orgState } = body;

    if (!email || !orgId || !orgState) {
      return new Response(JSON.stringify({ error: "Missing email, orgId or orgState" }), { status: 400 });
    }

    // 1. Upsert User preferences
    await dbPool.query(
      `INSERT INTO user_preferences (email, active_org_id, theme, updated_at) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
       ON CONFLICT (email) 
       DO UPDATE SET active_org_id = EXCLUDED.active_org_id, theme = EXCLUDED.theme, updated_at = CURRENT_TIMESTAMP`,
      [email, orgId, theme || "night"]
    );

    // 2. Upsert Org state
    await dbPool.query(
      `INSERT INTO organization_state (org_id, state_json, updated_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP) 
       ON CONFLICT (org_id) 
       DO UPDATE SET state_json = EXCLUDED.state_json, updated_at = CURRENT_TIMESTAMP`,
      [orgId, JSON.stringify(orgState)]
    );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
