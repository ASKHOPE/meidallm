import fs from "fs";
const env = fs.readFileSync(".env", "utf8");
for (const line of env.split("\n")) {
    if (line.trim() && !line.startsWith("#")) {
        const [key, ...val] = line.split("=");
        process.env[key.trim()] = val.join("=").trim();
    }
}

async function seedDatabase() {
    const { dbPool } = await import("../auth");
    console.log("Starting backend database seeding...");

    try {
        const currentUserEmail = "developer@example.com";
        const orgId1 = "org-1";
        const orgId2 = "org-2";

        // Create empty org state templates
        const createEmptyState = () => ({
            kanbanState: [],
            projects: [],
            ideasState: [],
            taskLogs: [],
            researchDocs: [],
            mediaAssets: [],
            drafts: [],
            connections: [],
            publishSchedules: [],
            contacts: [],
            team: [],
            teams: [],
            tenants: [],
            organizations: [],
            activityLogs: [],
            cycles: [],
            modules: [],
            tables: [],
            goals: [],
            salesInvoices: [],
            p2pTransactions: [],
            inventoryItems: [],
            supportCases: [],
            employees: [],
            candidates: [],
            timeLogs: []
        });

        const state1 = createEmptyState();
        const state2 = createEmptyState();

        // 2 Tenants
        state1.tenants.push({ id: "t-1", name: "AeroSpace Corp" }, { id: "t-2", name: "Oceanic Labs" });
        state2.tenants.push({ id: "t-1", name: "AeroSpace Corp" }, { id: "t-2", name: "Oceanic Labs" });

        // 2 Orgs
        state1.organizations.push({ id: "org-1", tenantId: "t-1", name: "AeroSpace Engineering" }, { id: "org-2", tenantId: "t-2", name: "Oceanic Research" });
        state2.organizations.push({ id: "org-1", tenantId: "t-1", name: "AeroSpace Engineering" }, { id: "org-2", tenantId: "t-2", name: "Oceanic Research" });

        // 8 Users total (4 per team)
        const users = [
            { id: "u-1", name: "Developer (You)", email: currentUserEmail, role: "Super Admin", systemRole: "super_admin", status: "active", avatarColor: "#ec4899" },
            { id: "u-2", name: "Alice Vance", email: "alice@example.com", role: "Lead Engineer", systemRole: "org_admin", status: "active", avatarColor: "#3b82f6" },
            { id: "u-3", name: "Bob Jones", email: "bob@example.com", role: "Product Manager", systemRole: "user", status: "meeting", avatarColor: "#10b981" },
            { id: "u-4", name: "Charlie Brown", email: "charlie@example.com", role: "QA Specialist", systemRole: "user", status: "offline", avatarColor: "#f59e0b" },
            { id: "u-5", name: "Diana Prince", email: "diana@example.com", role: "UX Designer", systemRole: "user", status: "active", avatarColor: "#8b5cf6" },
            { id: "u-6", name: "Evan Wright", email: "evan@example.com", role: "Data Scientist", systemRole: "user", status: "offline", avatarColor: "#ef4444" },
            { id: "u-7", name: "Fiona Gallagher", email: "fiona@example.com", role: "Marketing Lead", systemRole: "user", status: "active", avatarColor: "#14b8a6" },
            { id: "u-8", name: "George Miller", email: "george@example.com", role: "Support Staff", systemRole: "user", status: "meeting", avatarColor: "#f97316" }
        ];
        // @ts-ignore
        state1.team.push(...users);
        // @ts-ignore
        state2.team.push(...users);

        // 2 Teams
        const teams = [
            { id: "team-1", orgId: "org-1", name: "Flight Systems", memberIds: [currentUserEmail, "alice@example.com", "bob@example.com", "charlie@example.com"], projectIds: ["p-1"] },
            { id: "team-2", orgId: "org-2", name: "Deep Sea Dynamics", memberIds: ["diana@example.com", "evan@example.com", "fiona@example.com", "george@example.com"], projectIds: ["p-2"] }
        ];
        // @ts-ignore
        state1.teams.push(...teams);
        // @ts-ignore
        state2.teams.push(...teams);

        // 2 Projects
        const project1 = { id: "p-1", tenantId: "t-1", name: "Orion Rocket Engine", description: "Developing the next generation Orion liquid-fuel rocket propulsion systems.", isStarred: true, created: Date.now() - 86400000 * 5, updated: Date.now() };
        const project2 = { id: "p-2", tenantId: "t-2", name: "Mariana Explorer", description: "Autonomous underwater vehicle design for Mariana trench exploration.", isStarred: false, created: Date.now() - 86400000 * 3, updated: Date.now() };
        // @ts-ignore
        state1.projects.push(project1, project2);
        // @ts-ignore
        state2.projects.push(project1, project2);

        // Kanban Tasks
        const task1 = { id: "tsk-1", projectId: "p-1", title: "Optimize nozzle expansion ratio", tag: "Engineering", status: "progress", assignee: "Alice Vance", priority: "high", points: 5, created: Date.now() - 3600000 * 5, updated: Date.now() - 3600000 * 2, subtasks: [ { id: "st-1", projectId: "p-1", title: "Run high-altitude vacuum simulation", tag: "Simulation", status: "done", created: Date.now(), updated: Date.now() }, { id: "st-2", projectId: "p-1", title: "Calculate thermodynamic limits", tag: "Math", status: "progress", created: Date.now(), updated: Date.now() } ], comments: [ { id: "c-1", author: "alice@example.com", text: "Simulation shows 98.4% nozzle efficiency with current bell geometry.", timestamp: Date.now() - 3600000 * 3 } ] };
        const task2 = { id: "tsk-2", projectId: "p-2", title: "Sonar sensor pressure test", tag: "Testing", status: "backlog", assignee: "Bob Vance", priority: "medium", points: 3, created: Date.now() - 3600000 * 8, updated: Date.now() - 3600000 * 4 };
        // @ts-ignore
        state1.kanbanState.push(task1, task2);
        // @ts-ignore
        state2.kanbanState.push(task1, task2);

        // Drafts
        const draft1 = { id: "dr-1", projectId: "p-1", title: "Orion Rocket Engine Specs Overview", content: JSON.stringify({ blocks: [ { type: "header", text: "Orion Launch Mechanics" }, { type: "paragraph", text: "Today we outline the thermal constraints of the primary combustion chamber..." } ] }), format: "blog", cmsStatus: "draft", created: Date.now() - 3600000 * 12, updated: Date.now() - 3600000 * 6 };
        const draft2 = { id: "dr-2", projectId: "p-2", title: "Deep Sea Expedition Logistics", content: JSON.stringify({ blocks: [ { type: "header", text: "Expedition Logistics" }, { type: "paragraph", text: "Vessel positioning and deployment window schedules for the Mariana Trench..." } ] }), format: "email", cmsStatus: "draft", created: Date.now() - 3600000 * 24, updated: Date.now() - 3600000 * 18 };
        const review1 = { id: "dr-3", projectId: "p-1", title: "Propulsion Safety Report", content: JSON.stringify({ blocks: [ { type: "header", text: "Propulsion Fuel Line Safety" }, { type: "paragraph", text: "Detailed failure-mode simulation of liquid helium backup feed lines..." } ] }), format: "blog", cmsStatus: "review", created: Date.now() - 3600000 * 48, updated: Date.now() - 3600000 * 20 };
        const review2 = { id: "dr-4", projectId: "p-2", title: "Pressure Hull Finite Element Analysis", content: JSON.stringify({ blocks: [ { type: "header", text: "Pressure Hull stress points under 11,000 meters" }, { type: "paragraph", text: "Titanium casing shows safety factor of 1.45 at max depth..." } ] }), format: "blog", cmsStatus: "review", created: Date.now() - 3600000 * 72, updated: Date.now() - 3600000 * 30 };
        // @ts-ignore
        state1.drafts.push(draft1, draft2, review1, review2);
        // @ts-ignore
        state2.drafts.push(draft1, draft2, review1, review2);

        // Ideas
        const idea1 = { id: "id-1", projectId: "p-1", content: "Use carbon-fiber composites for outer engine fairing.", x: 150, y: 120, color: "bg-yellow-500/20" };
        const idea2 = { id: "id-2", projectId: "p-2", content: "Integrate dual-frequency active sonar for mapping.", x: 350, y: 180, color: "bg-blue-500/20" };
        // @ts-ignore
        state1.ideasState.push(idea1, idea2);
        // @ts-ignore
        state2.ideasState.push(idea1, idea2);

        // Logs
        const log1 = { id: "log-1", projectId: "p-1", taskId: "tsk-1", taskTitle: "Optimize nozzle expansion ratio", fromStatus: "backlog", toStatus: "progress", timestamp: Date.now() - 3600000 * 2 };
        const log2 = { id: "log-2", projectId: "p-2", taskId: "tsk-2", taskTitle: "Sonar sensor pressure test", fromStatus: "created", toStatus: "backlog", timestamp: Date.now() - 3600000 * 4 };
        // @ts-ignore
        state1.taskLogs.push(log1, log2);
        // @ts-ignore
        state2.taskLogs.push(log1, log2);

        // Ensure database tables exist
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

        // Insert / Update User Preferences
        await dbPool.query(
            `INSERT INTO user_preferences (email, active_org_id, theme, updated_at) 
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
             ON CONFLICT (email) 
             DO UPDATE SET active_org_id = EXCLUDED.active_org_id, theme = EXCLUDED.theme, updated_at = CURRENT_TIMESTAMP`,
            [currentUserEmail, orgId1, "night"]
        );

        // Upsert Org state for both orgs
        await dbPool.query(
            `INSERT INTO organization_state (org_id, state_json, updated_at) 
             VALUES ($1, $2, CURRENT_TIMESTAMP) 
             ON CONFLICT (org_id) 
             DO UPDATE SET state_json = EXCLUDED.state_json, updated_at = CURRENT_TIMESTAMP`,
            [orgId1, JSON.stringify(state1)]
        );

        await dbPool.query(
            `INSERT INTO organization_state (org_id, state_json, updated_at) 
             VALUES ($1, $2, CURRENT_TIMESTAMP) 
             ON CONFLICT (org_id) 
             DO UPDATE SET state_json = EXCLUDED.state_json, updated_at = CURRENT_TIMESTAMP`,
            [orgId2, JSON.stringify(state2)]
        );

        console.log("✅ Successfully seeded database with mock data!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
}

seedDatabase();
