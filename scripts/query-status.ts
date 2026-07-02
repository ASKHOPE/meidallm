import fs from "fs";
const env = fs.readFileSync(".env", "utf8");
for (const line of env.split("\n")) {
    if (line.trim() && !line.startsWith("#")) {
        const [key, ...val] = line.split("=");
        process.env[key.trim()] = val.join("=").trim();
    }
}
async function checkStatus() {
    const { dbPool } = await import("../auth");
    const res = await dbPool.query("SELECT state_json FROM organization_state WHERE org_id = 'org-1'");
    if (res.rows.length > 0) {
        const state = JSON.parse(res.rows[0].state_json);
        console.log("Users and their statuses in org-1:");
        state.team.forEach((u: any) => {
            console.log(`- ${u.name} (${u.role}): ${u.status}`);
        });
    }
    process.exit(0);
}
checkStatus();
