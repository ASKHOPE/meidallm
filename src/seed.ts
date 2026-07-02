import { state, saveState, notifyStateChange } from "./state";
import type { Tenant, Organization, Team, TeamMember, Project, KanbanTask, Draft, Idea, TaskLog } from "./types";

export function resetAndSeedData() {
    console.log("Resetting and seeding mock data...");

    // Keep the current user
    const currentUserEmail = state.currentUser || "developer@example.com";

    // 1. Wipe state arrays (excluding current user prefs)
    state.tenants = [];
    state.organizations = [];
    state.teams = [];
    state.team = [];
    state.projects = [];
    state.kanbanState = [];
    state.drafts = [];
    state.ideasState = [];
    state.taskLogs = [];
    state.activityLogs = [];
    state.timeLogs = [];
    state.cycles = [];
    state.modules = [];

    // 2. Create 2 Tenants
    const tenant1: Tenant = { id: "t-1", name: "AeroSpace Corp" };
    const tenant2: Tenant = { id: "t-2", name: "Oceanic Labs" };
    state.tenants.push(tenant1, tenant2);

    // 3. Create 2 Organizations (under Tenants)
    const org1: Organization = { id: "org-1", tenantId: "t-1", name: "AeroSpace Engineering" };
    const org2: Organization = { id: "org-2", tenantId: "t-2", name: "Oceanic Research" };
    state.organizations.push(org1, org2);

    // 4. Create 4 Users inside the Teams
    // User 1: Current User (Vance)
    // User 2: Alice Smith
    // User 3: Bob Jones
    // User 4: Charlie Brown
    const user1: TeamMember = {
        id: "u-1",
        name: "Developer (You)",
        email: currentUserEmail,
        role: "Super Admin",
        systemRole: "super_admin",
        status: "active",
        avatarColor: "#ec4899"
    };
    const user2: TeamMember = {
        id: "u-2",
        name: "Alice Vance",
        email: "alice@example.com",
        role: "Lead Engineer",
        systemRole: "org_admin",
        status: "active",
        avatarColor: "#3b82f6"
    };
    const user3: TeamMember = {
        id: "u-3",
        name: "Bob Vance",
        email: "bob@example.com",
        role: "Product Manager",
        systemRole: "user",
        status: "meeting",
        avatarColor: "#10b981"
    };
    const user4: TeamMember = {
        id: "u-4",
        name: "Charlie Brown",
        email: "charlie@example.com",
        role: "QA Specialist",
        systemRole: "user",
        status: "offline",
        avatarColor: "#f59e0b"
    };
    state.team.push(user1, user2, user3, user4);

    // 5. Create 2 Teams
    // Team 1: Flight Systems (under Org 1)
    // Team 2: Deep Sea Dynamics (under Org 2)
    const team1: Team = {
        id: "team-1",
        orgId: "org-1",
        name: "Flight Systems",
        memberIds: [currentUserEmail, "alice@example.com"],
        projectIds: ["p-1"]
    };
    const team2: Team = {
        id: "team-2",
        orgId: "org-2",
        name: "Deep Sea Dynamics",
        memberIds: ["bob@example.com", "charlie@example.com"],
        projectIds: ["p-2"]
    };
    state.teams.push(team1, team2);

    // 6. Create 2 Projects
    const project1: Project = {
        id: "p-1",
        tenantId: "t-1", // Match Tenant 1
        name: "Orion Rocket Engine",
        description: "Developing the next generation Orion liquid-fuel rocket propulsion systems.",
        isStarred: true,
        created: Date.now() - 86400000 * 5,
        updated: Date.now()
    };
    const project2: Project = {
        id: "p-2",
        tenantId: "t-2", // Match Tenant 2
        name: "Mariana Explorer",
        description: "Autonomous underwater vehicle design for Mariana trench exploration.",
        isStarred: false,
        created: Date.now() - 86400000 * 3,
        updated: Date.now()
    };
    state.projects.push(project1, project2);

    // 7. Create Kanban Tasks (2 items)
    const task1: KanbanTask = {
        id: "tsk-1",
        projectId: "p-1",
        title: "Optimize nozzle expansion ratio",
        tag: "Engineering",
        status: "progress",
        assignee: "Alice Vance",
        priority: "high",
        points: 5,
        created: Date.now() - 3600000 * 5,
        updated: Date.now() - 3600000 * 2,
        subtasks: [
            { id: "st-1", projectId: "p-1", title: "Run high-altitude vacuum simulation", tag: "Simulation", status: "done", created: Date.now(), updated: Date.now() },
            { id: "st-2", projectId: "p-1", title: "Calculate thermodynamic limits", tag: "Math", status: "progress", created: Date.now(), updated: Date.now() }
        ],
        comments: [
            { id: "c-1", author: "alice@example.com", text: "Simulation shows 98.4% nozzle efficiency with current bell geometry.", timestamp: Date.now() - 3600000 * 3 }
        ]
    };
    const task2: KanbanTask = {
        id: "tsk-2",
        projectId: "p-2",
        title: "Sonar sensor pressure test",
        tag: "Testing",
        status: "backlog",
        assignee: "Bob Vance",
        priority: "medium",
        points: 3,
        created: Date.now() - 3600000 * 8,
        updated: Date.now() - 3600000 * 4
    };
    state.kanbanState.push(task1, task2);

    // 8. Create Drafts and Reviews (2 items each)
    const draft1: Draft = {
        id: "dr-1",
        projectId: "p-1",
        title: "Orion Rocket Engine Specs Overview",
        content: JSON.stringify({
            blocks: [
                { type: "header", text: "Orion Launch Mechanics" },
                { type: "paragraph", text: "Today we outline the thermal constraints of the primary combustion chamber..." }
            ]
        }),
        format: "blog",
        cmsStatus: "draft",
        created: Date.now() - 3600000 * 12,
        updated: Date.now() - 3600000 * 6
    };
    const draft2: Draft = {
        id: "dr-2",
        projectId: "p-2",
        title: "Deep Sea Expedition Logistics",
        content: JSON.stringify({
            blocks: [
                { type: "header", text: "Expedition Logistics" },
                { type: "paragraph", text: "Vessel positioning and deployment window schedules for the Mariana Trench..." }
            ]
        }),
        format: "email",
        cmsStatus: "draft",
        created: Date.now() - 3600000 * 24,
        updated: Date.now() - 3600000 * 18
    };
    const review1: Draft = {
        id: "dr-3",
        projectId: "p-1",
        title: "Propulsion Safety Report",
        content: JSON.stringify({
            blocks: [
                { type: "header", text: "Propulsion Fuel Line Safety" },
                { type: "paragraph", text: "Detailed failure-mode simulation of liquid helium backup feed lines..." }
            ]
        }),
        format: "blog",
        cmsStatus: "review",
        created: Date.now() - 3600000 * 48,
        updated: Date.now() - 3600000 * 20
    };
    const review2: Draft = {
        id: "dr-4",
        projectId: "p-2",
        title: "Pressure Hull Finite Element Analysis",
        content: JSON.stringify({
            blocks: [
                { type: "header", text: "Pressure Hull stress points under 11,000 meters" },
                { type: "paragraph", text: "Titanium casing shows safety factor of 1.45 at max depth..." }
            ]
        }),
        format: "blog",
        cmsStatus: "review",
        created: Date.now() - 3600000 * 72,
        updated: Date.now() - 3600000 * 30
    };
    state.drafts.push(draft1, draft2, review1, review2);

    // 9. Create 2 Ideas (Idea Canvas sticky notes)
    const idea1: Idea = {
        id: "id-1",
        projectId: "p-1",
        content: "Use carbon-fiber composites for outer engine fairing.",
        x: 150,
        y: 120,
        color: "bg-yellow-500/20"
    };
    const idea2: Idea = {
        id: "id-2",
        projectId: "p-2",
        content: "Integrate dual-frequency active sonar for mapping.",
        x: 350,
        y: 180,
        color: "bg-blue-500/20"
    };
    state.ideasState.push(idea1, idea2);

    // 10. Add some sample logs (Task Logs & Activity Logs)
    const log1: TaskLog = {
        id: "log-1",
        projectId: "p-1",
        taskId: "tsk-1",
        taskTitle: "Optimize nozzle expansion ratio",
        fromStatus: "backlog",
        toStatus: "progress",
        timestamp: Date.now() - 3600000 * 2
    };
    const log2: TaskLog = {
        id: "log-2",
        projectId: "p-2",
        taskId: "tsk-2",
        taskTitle: "Sonar sensor pressure test",
        fromStatus: "created",
        toStatus: "backlog",
        timestamp: Date.now() - 3600000 * 4
    };
    state.taskLogs.push(log1, log2);

    // 11. Set initial navigation states to match the seeded data
    state.activeTenantId = "t-1";
    state.activeOrgId = "org-1";
    state.activeTeamId = "team-1";
    state.currentProject = "p-1";
    state.activeViewKey = "workspaces"; // Go to workspaces first

    // 12. Save and trigger reload
    saveState();
    notifyStateChange();

    if (window.showToast) {
        window.showToast("Database wiped and seeded with 2 Tenants, 2 Orgs, 2 Teams, 4 Users, 2 Projects, 2 Tasks, 2 Drafts & 2 Reviews!", "success");
    }

    // Force page reload after short delay to rebuild UI with seeded state
    setTimeout(() => {
        location.reload();
    }, 1500);
}

// Bind to window for global access
if (typeof window !== "undefined") {
    (window as any).resetAndSeedData = resetAndSeedData;
}
