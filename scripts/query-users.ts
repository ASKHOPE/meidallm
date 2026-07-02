import fs from "fs";
const env = fs.readFileSync(".env", "utf8");
for (const line of env.split("\n")) {
    if (line.trim() && !line.startsWith("#")) {
        const [key, ...val] = line.split("=");
        process.env[key.trim()] = val.join("=").trim();
    }
}
async function checkUsers() {
    const { dbPool } = await import("../auth");
    const res = await dbPool.query("SELECT * FROM user_preferences");
    console.log("User Prefs:", res.rows);
    try {
        const sessionRes = await dbPool.query('SELECT * FROM "user"');
        console.log("Users in Auth:", sessionRes.rows.map(r => r.email));
    } catch (e) { console.log(e); }
    process.exit(0);
}
checkUsers();
