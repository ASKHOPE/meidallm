import fs from "fs";
const env = fs.readFileSync(".env", "utf8");
for (const line of env.split("\n")) {
    if (line.trim() && !line.startsWith("#")) {
        const [key, ...val] = line.split("=");
        process.env[key.trim()] = val.join("=").trim();
    }
}

async function checkDatabase() {
    const { dbPool } = await import("../auth");
    try {
        const res = await dbPool.query("SELECT org_id, state_json FROM organization_state");
        console.log(`Found ${res.rows.length} rows in organization_state table.`);
        for (const row of res.rows) {
            const state = JSON.parse(row.state_json);
            console.log(`--- ORG ID: ${row.org_id} ---`);
            console.log(`Tenants: ${state.tenants?.length}`);
            console.log(`Organizations: ${state.organizations?.length}`);
            console.log(`Teams: ${state.teams?.length}`);
            console.log(`Users in Team: ${state.team?.length}`);
            console.log(`Projects: ${state.projects?.length}`);
            console.log(`Kanban Tasks: ${state.kanbanState?.length}`);
            console.log(`Drafts/Reviews: ${state.drafts?.length}`);
            console.log(`Ideas: ${state.ideasState?.length}`);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkDatabase();
