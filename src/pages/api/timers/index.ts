import type { APIRoute } from "astro";
import { dbPool } from "../../../../auth";

// ─── DB INIT ────────────────────────────────────────────────────────────────
// Creates tables on first hit if they don't exist yet
let dbReady = false;
async function ensureDb() {
  if (dbReady) return;
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS timer_sessions (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL,
      user_email    TEXT,
      org_id        TEXT,
      team_id       TEXT,
      project_id    TEXT,
      project_name  TEXT,
      task_id       TEXT,
      task_title    TEXT,
      description   TEXT,
      billable      BOOLEAN DEFAULT TRUE,
      start_time    TIMESTAMPTZ NOT NULL,
      end_time      TIMESTAMPTZ,
      duration_ms   BIGINT,
      status        TEXT DEFAULT 'running',   -- running | completed | discarded
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS time_log_entries (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL,
      user_email    TEXT,
      org_id        TEXT,
      team_id       TEXT,
      project_id    TEXT,
      project_name  TEXT,
      task_id       TEXT,
      task_title    TEXT,
      description   TEXT,
      billable      BOOLEAN DEFAULT TRUE,
      date          TEXT,
      start_time    TEXT,
      end_time      TEXT,
      duration_ms   BIGINT NOT NULL,
      log_timestamp BIGINT NOT NULL,
      approval_status TEXT DEFAULT 'pending',  -- pending | approved | rejected
      approved_by   TEXT,
      hourly_rate   NUMERIC(10,2),
      source        TEXT DEFAULT 'manual',     -- manual | timer | import
      synced_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  dbReady = true;
}

// ─── GET: fetch active timer or recent logs ─────────────────────────────────
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const userId = url.searchParams.get("userId") || url.searchParams.get("email");

  if (!userId) return json({ error: "userId required" }, 400);

  try {
    await ensureDb();

    if (action === "active") {
      // Return the currently running timer for this user
      const res = await dbPool.query(
        `SELECT * FROM timer_sessions WHERE user_id = $1 AND status = 'running' ORDER BY start_time DESC LIMIT 1`,
        [userId]
      );
      return json({ timer: res.rows[0] || null });
    }

    if (action === "logs") {
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const since = url.searchParams.get("since"); // ISO timestamp
      let query = `SELECT * FROM time_log_entries WHERE user_id = $1`;
      const params: any[] = [userId];
      if (since) {
        query += ` AND log_timestamp >= $2`;
        params.push(parseInt(since));
      }
      query += ` ORDER BY log_timestamp DESC LIMIT $${params.length + 1}`;
      params.push(limit);
      const res = await dbPool.query(query, params);
      return json({ logs: res.rows });
    }

    if (action === "team-logs") {
      // Managers can fetch team logs by orgId or teamId
      const orgId = url.searchParams.get("orgId");
      const teamId = url.searchParams.get("teamId");
      if (!orgId && !teamId) return json({ error: "orgId or teamId required" }, 400);
      
      const field = teamId ? "team_id" : "org_id";
      const value = teamId || orgId;
      const res = await dbPool.query(
        `SELECT * FROM time_log_entries WHERE ${field} = $1 ORDER BY log_timestamp DESC LIMIT 200`,
        [value]
      );
      return json({ logs: res.rows });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    console.error("[timer GET error]", e);
    return json({ error: e.message }, 500);
  }
};

// ─── POST: start | stop | discard | sync-log ────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const { action } = body;
  if (!action) return json({ error: "action required" }, 400);

  try {
    await ensureDb();

    // ── START timer ──────────────────────────────────────────────────────────
    if (action === "start") {
      const { id, userId, userEmail, orgId, teamId, projectId, projectName, taskId, taskTitle, description, billable, startTime } = body;
      
      // Kill any existing running timer for this user first
      await dbPool.query(
        `UPDATE timer_sessions SET status = 'discarded', end_time = NOW() WHERE user_id = $1 AND status = 'running'`,
        [userId]
      );

      await dbPool.query(
        `INSERT INTO timer_sessions (id, user_id, user_email, org_id, team_id, project_id, project_name, task_id, task_title, description, billable, start_time, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'running')
         ON CONFLICT (id) DO UPDATE SET status='running', start_time=$12`,
        [id, userId, userEmail, orgId, teamId, projectId, projectName, taskId, taskTitle, description, billable ?? true, new Date(startTime)]
      );

      return json({ ok: true, id, startTime });
    }

    // ── STOP timer (creates completed log entry) ─────────────────────────────
    if (action === "stop") {
      const { id, userId, endTime, durationMs } = body;
      const endTs = endTime ? new Date(endTime) : new Date();

      // Mark session as completed
      const sessionRes = await dbPool.query(
        `UPDATE timer_sessions SET status='completed', end_time=$1, duration_ms=$2 WHERE id=$3 AND user_id=$4 RETURNING *`,
        [endTs, durationMs, id, userId]
      );
      const session = sessionRes.rows[0];
      if (!session) return json({ error: "Timer session not found" }, 404);

      // Insert into permanent log
      const logId = 'tl-' + Math.random().toString(36).substr(2, 9);
      await dbPool.query(
        `INSERT INTO time_log_entries (id, user_id, user_email, org_id, team_id, project_id, project_name, task_id, task_title, description, billable, duration_ms, log_timestamp, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'timer')`,
        [logId, session.user_id, session.user_email, session.org_id, session.team_id, session.project_id, session.project_name, session.task_id, session.task_title, session.description, session.billable, durationMs, endTs.getTime()]
      );

      return json({ ok: true, logId, durationMs });
    }

    // ── DISCARD timer ────────────────────────────────────────────────────────
    if (action === "discard") {
      const { id, userId } = body;
      await dbPool.query(
        `UPDATE timer_sessions SET status='discarded', end_time=NOW() WHERE id=$1 AND user_id=$2`,
        [id, userId]
      );
      return json({ ok: true });
    }

    // ── SYNC-LOG: upsert a manual log entry from localStorage ────────────────
    if (action === "sync-log") {
      const { log } = body;
      if (!log?.id) return json({ error: "log.id required" }, 400);
      
      await dbPool.query(
        `INSERT INTO time_log_entries (id, user_id, user_email, org_id, team_id, project_id, project_name, task_id, task_title, description, billable, date, start_time, end_time, duration_ms, log_timestamp, approval_status, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'manual')
         ON CONFLICT (id) DO NOTHING`,
        [log.id, log.userId, log.userEmail || log.userName, log.orgId, log.teamId, log.projectId, log.projectName, log.taskId, log.taskTitle, log.description, log.billable ?? true, log.date, log.startTime, log.endTime, log.durationMs, log.timestamp]
      );
      return json({ ok: true, id: log.id });
    }

    // ── APPROVE / REJECT ─────────────────────────────────────────────────────
    if (action === "approve" || action === "reject") {
      const { logId, approvedBy } = body;
      await dbPool.query(
        `UPDATE time_log_entries SET approval_status=$1, approved_by=$2 WHERE id=$3`,
        [action === "approve" ? "approved" : "rejected", approvedBy, logId]
      );
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    console.error("[timer POST error]", e);
    return json({ error: e.message }, 500);
  }
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
