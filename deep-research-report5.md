# ClickUp Clone — Full Feature Specification for Code Generation

## Purpose
This document is a structured product specification extracted from ClickUp's official product pages. Use it as the single source of truth when generating code for a ClickUp-like project management and AI productivity platform. Each section describes a feature, what it does, how it behaves, and what UI/logic must be built.

---

## 1. WORKSPACE STRUCTURE

### 1.1 Spaces
- The top-level organizational unit inside a workspace.
- Each Space is a container for Lists, Folders, and tasks.
- Spaces can have their own custom statuses, tags, members, and permissions.
- Users can create multiple Spaces per workspace (e.g., "Engineering", "Marketing", "HR").

### 1.2 Folders
- Optional grouping layer that lives inside a Space.
- Contains one or more Lists.
- Useful for grouping related Lists under a project or department.

### 1.3 Lists
- A collection of tasks inside a Space or Folder.
- Every task must belong to a List.
- Lists have their own views, statuses, and settings.

### 1.4 Everything View
- A global view that shows all tasks across all Spaces, Folders, and Lists in the workspace.
- Can be filtered, grouped, and sorted just like any other view.
- Allows cross-workspace visibility from a single screen.

---

## 2. TASKS

### 2.1 Core Task Fields
Every task must support the following fields:
- **Title** — Short name describing the task.
- **Description** — Rich text body for full context, notes, or specs.
- **Status** — Current state in the workflow (e.g., To Do, In Progress, Done). Statuses are customizable per List or Space.
- **Priority** — Four levels: Urgent, High, Normal, Low. Visually color-coded.
- **Assignees** — One or more team members assigned to the task. Tasks support multiple assignees simultaneously.
- **Due Date** — A deadline for when the task must be completed. Supports date + time.
- **Start Date** — Optional start date for when work begins.
- **Tags** — Custom labels applied to tasks for cross-cutting categorization (see Section 3).
- **Time Estimate** — Estimated hours or minutes needed to complete the task.
- **Time Tracked** — Actual time logged against the task via a timer or manual entry.
- **Attachments** — Files and images that can be uploaded to the task.
- **Watchers** — Team members who follow the task and receive notifications on changes.

### 2.2 Subtasks
- Tasks can have an unlimited number of nested subtasks.
- Subtasks behave like full tasks — they have their own status, assignee, due date, and priority.
- Subtasks are visible in the parent task's detail view and can be collapsed or expanded.
- Subtask completion rolls up to indicate parent task progress.

### 2.3 Checklists
- Lightweight to-do lists inside a task, separate from subtasks.
- Each checklist item is a simple checkbox line.
- Multiple checklists can exist inside one task (e.g., "QA Checklist", "Launch Checklist").
- Completion percentage is tracked and displayed.

### 2.4 Dependencies
- Tasks can be linked as blockers or dependents.
- A task marked as "blocked by" cannot be started until its blocker is resolved.
- Warnings and visual indicators appear when blocked tasks are overdue or stalled.
- Dependencies are visualized in Gantt view (see Section 6.4).

### 2.5 Recurring Tasks
- Tasks can be set to automatically recreate on a schedule.
- Recurrence options: daily, weekly, monthly, yearly, or custom interval.
- On completion, a new instance is automatically created with reset status.
- The original task history is retained separately from the recurring copy.

### 2.6 Task Relationships
- Tasks can be linked to other tasks with relationship types: "relates to", "duplicate of", "blocks", "blocked by".
- Related tasks appear in a dedicated section inside the task detail view.

### 2.7 Comments and Activity
- Each task has a comment thread where team members can discuss.
- Comments support @mentions to notify specific users.
- Rich text, emoji, and file attachments are supported inside comments.
- An Activity feed logs every change made to the task (status change, assignee added, field edited) with timestamp and user attribution.

### 2.8 Clips (Screen Recordings)
- Users can record and attach short screen recordings directly to a task.
- Clips are stored inline and play back inside the task detail view without needing an external tool.

### 2.9 Custom Fields
- Admins and members can add custom fields to tasks beyond the default fields.
- Supported custom field types:
  - **Text** — Free-form short text input.
  - **Number** — Numeric value (e.g., budget, deal size, count).
  - **Dropdown** — Single-select from a predefined list of options.
  - **Labels** — Multi-select tags.
  - **Date** — Date picker.
  - **Checkbox** — Boolean true/false.
  - **People** — Assign a team member as a field value.
  - **URL** — Hyperlink input.
  - **Email** — Email address input.
  - **Phone** — Phone number input.
  - **Currency** — Monetary value with currency symbol.
  - **Rating** — Star or numeric rating.
  - **Progress** — Manual or automatic percentage bar.
  - **Formula** — Calculated field based on other field values.
- Custom fields are configurable at the Space, Folder, or List level.
- Field values are filterable, sortable, and visible in all views.

### 2.10 Milestones
- Special task type that marks a significant project checkpoint.
- Visually distinct from regular tasks (diamond icon in Gantt view).
- No duration — represents a point in time, not a range.
- Used to signal delivery dates, releases, or phase completions.

---

## 3. TASK TAGS

### 3.1 How Tags Work
- Tags are custom labels applied to tasks for organizational purposes beyond status or location.
- A task can have multiple tags simultaneously.
- Tags are localized to each Space — each Space manages its own tag library, preventing tag sprawl across the whole workspace.

### 3.2 Tag Management
- Tags are created, renamed, colored, and deleted from within the Space settings.
- Each tag has a name and a color for quick visual identification.
- Tags can be applied to tasks in bulk from list view.

### 3.3 Filtering by Tags
- Tasks can be filtered by one or more tags in any view (List, Board, Calendar, etc.).
- Filter logic supports **Match Any** (OR) or **Match All** (AND) for multi-tag filtering.
- Tag filters can be combined with other filters (status, assignee, due date) for precise task discovery.

### 3.4 Tag Use Cases
- **Development teams:** Tag tasks by sprint name, release version, or environment (e.g., `v2.1`, `staging`, `production`).
- **Marketing teams:** Tag tasks by channel or content type (e.g., `email`, `social`, `paid`, `organic`).
- **Operations/Sales:** Tag tasks by client name, region, or deal stage.

---

## 4. MULTIPLE VIEWS

Every List and Space supports multiple view types. Users can switch between views without losing any data. Views are saved per user or shared with the team.

### 4.1 List View
- Default tabular view showing all tasks as rows.
- Columns are customizable — show/hide fields, reorder columns.
- Tasks can be grouped by status, assignee, priority, custom field, or tag.
- Inline editing is supported — click any field in the row to edit without opening the task.
- Subtasks can be expanded or collapsed inline.

### 4.2 Board View (Kanban)
- Tasks displayed as cards organized into columns by status.
- Drag and drop cards between columns to update status.
- Cards show task name, assignee avatar, priority badge, and due date.
- Columns can be customized — rename, reorder, add, or remove statuses.
- WIP (Work In Progress) limits can be set per column.
- Cards can be filtered, grouped, and color-coded by field value.

### 4.3 Calendar View
- Tasks plotted on a monthly or weekly calendar grid based on due date or date range.
- Drag tasks on the calendar to reschedule.
- Color-code tasks by assignee, priority, status, or custom field.
- Supports multi-day tasks displayed as spanning blocks.

### 4.4 Gantt Chart View
- Timeline view showing tasks as horizontal bars across a time axis.
- Task bars represent start date to due date duration.
- Dependencies visualized as connecting arrows between task bars.
- Drag bar edges to extend or shorten task duration.
- Drag bars to move task dates while preserving relative dependencies.
- Critical path highlighting shows which tasks directly affect the project end date.
- Milestones appear as diamond markers on the timeline.

### 4.5 Timeline View
- Similar to Gantt but focused on a single dimension — date range.
- Shows who is working on what and when across the team.
- Useful for resource planning and workload distribution.

### 4.6 Workload View
- Shows capacity and task load per team member across a time period.
- Bars fill based on estimated or tracked hours per day/week.
- Managers can identify overloaded or underutilized team members at a glance and rebalance assignments.

### 4.7 Table View (Spreadsheet)
- Spreadsheet-style grid where every task is a row and every field is a column.
- Inline editing for all field types.
- Supports column-level formulas and aggregations (sum, average, count).
- Sortable and filterable like a spreadsheet.

### 4.8 Mind Map View
- Visual brainstorming canvas showing tasks as connected nodes.
- Tasks are linked hierarchically — parent tasks connect to subtasks via lines.
- Drag to reorder the hierarchy.
- Useful for planning phases, breaking down features, or mapping dependencies.

### 4.9 Map View
- Tasks with a location field are plotted on an interactive map.
- Useful for field operations, real estate, logistics, or event planning.

---

## 5. DASHBOARDS

### 5.1 Purpose
Dashboards provide a customizable reporting surface where teams can visualize data from across the workspace. They are built with drag-and-drop widgets.

### 5.2 Dashboard Widgets
Each widget displays a specific type of data visualization:

- **Bar Chart** — Compare task counts or field values across groups (status, assignee, priority).
- **Line Chart** — Track a metric over time (tasks completed per week, burn-down rate).
- **Pie / Donut Chart** — Show proportional breakdown (tasks by status, workload by person).
- **Number Widget** — Display a single aggregated metric (total tasks, overdue count, hours tracked).
- **Portfolio** — Track progress of multiple Lists or projects in one view, showing overall completion percentage.
- **Assignee Workload** — Visual bar showing each team member's task count or hours.
- **Text Widget** — Add labels, headings, or instructional notes to the dashboard.
- **Embed Widget** — Embed external URLs (Figma files, Google Sheets, Loom videos) inside the dashboard.
- **Sprint Widget** — Track sprint burndown and velocity for agile teams.
- **Activity Widget** — Show recent workspace activity as a live feed.
- **Time Tracked Widget** — Total time logged across tasks, filterable by member or date range.
- **Goals Widget** — Display goal progress (see Section 9).

### 5.3 Dashboard Customization
- Widgets are placed, resized, and reordered on a grid canvas via drag-and-drop.
- Each widget has individual filter settings (filter by Space, List, assignee, date range, status, etc.).
- Dashboards can be made private (visible only to creator) or shared with the team or entire workspace.
- Multiple dashboards can exist per workspace — e.g., "Engineering KPIs", "Marketing Dashboard", "Executive Overview".

---

## 6. DOCS AND WIKIS

### 6.1 Purpose
ClickUp Docs is a collaborative document editor embedded in the workspace. Docs are connected to tasks, projects, and people — not siloed from work.

### 6.2 Document Editor
- Rich text editor supporting headings (H1–H6), bold, italic, underline, strikethrough, code blocks, tables, and ordered/unordered lists.
- Block-based editor — each paragraph, heading, or media element is an individual block.
- Slash command (`/`) triggers an insert menu for adding new block types (image, table, code, task embed, callout, divider, etc.).
- Inline @mentions link to tasks, users, or other docs.
- Supports inline task creation — type `/task` to embed a new or existing task inside a doc.

### 6.3 Real-time Collaboration
- Multiple users can edit the same doc simultaneously.
- Each user's cursor is visible with their name and color.
- Changes are saved automatically with full version history.

### 6.4 Version History
- Every saved version of a doc is stored and can be restored.
- Users can view a diff between any two versions.

### 6.5 Doc Permissions
- Docs can be set to workspace-visible, List-specific, or private.
- Shareable via a public link (read-only) for external stakeholders.
- Password protection available for sensitive docs.

### 6.6 Wikis
- Docs can be organized into a structured Wiki hierarchy with parent pages and nested subpages.
- Wiki navigation sidebar shows the full page tree.
- Used for internal knowledge bases, onboarding guides, SOPs, and playbooks.
- Search is available across all Wiki content.

---

## 7. CHAT

### 7.1 Purpose
Built-in team messaging so that communication happens alongside work, not in a separate app.

### 7.2 Channels
- Create public or private channels for teams, projects, or topics.
- Channels are linked to Spaces or Lists, giving all messages the context of the work they relate to.
- Channel members are managed per channel.

### 7.3 Direct Messages
- One-on-one or group DMs between workspace members.

### 7.4 Message Features
- Rich text formatting inside messages.
- File and image attachments.
- Emoji reactions.
- @mentions for users, tasks, and docs.
- Threaded replies to keep discussions organized.
- Pin important messages inside a channel.

### 7.5 Task Creation from Chat
- Any message in chat can be converted into a task with one click.
- The task is created with the message content pre-filled, linked back to the original chat message.
- Super Agents can monitor chat and auto-create tasks based on keywords or assignments (see Section 11).

---

## 8. CALENDAR

### 8.1 Task Calendar
- Displays all tasks with due dates on a calendar interface.
- Supports day, week, and month views.
- Drag tasks to reschedule them.

### 8.2 Google Calendar & Outlook Sync
- Two-way sync with Google Calendar and Outlook.
- Meetings from external calendars appear in ClickUp Calendar.
- ClickUp tasks with due dates appear in external calendar apps.

### 8.3 Scheduling (Booking Pages)
- Users can create a public booking page with available time slots.
- External people book meetings from the page; the event auto-creates in the host's calendar.
- Similar to Calendly functionality built natively into ClickUp.

---

## 9. GOALS

### 9.1 Purpose
Goals allow teams to define measurable objectives and track real progress tied to actual task completion.

### 9.2 Goal Structure
- Each Goal has a title, description, due date, and owner.
- Goals contain one or more **Targets** — measurable metrics that define success.
- Target types:
  - **Number** — Reach a specific numeric value (e.g., close 50 deals).
  - **Currency** — Hit a revenue or budget target (e.g., earn $100,000).
  - **True/False** — Binary completion flag (e.g., launch the product).
  - **Task completion** — Auto-update progress when linked tasks are completed.
  - **List completion** — Progress based on all tasks in a List being done.

### 9.3 Goal Folders
- Goals can be organized into folders (e.g., "Q3 OKRs", "Company Goals 2025").
- Visible to the whole team or restricted by role.

### 9.4 Progress Tracking
- Overall goal progress is calculated as the average of all target completion percentages.
- Color-coded health status: On Track, At Risk, Off Track.

---

## 10. TIME TRACKING

### 10.1 Native Time Tracker
- A timer is built into every task. Users start and stop the timer with one click.
- Multiple time entries can be logged per task (across different days or sessions).
- Manual time entry is also supported — enter hours and minutes directly.

### 10.2 Time Estimates
- Each task can have a time estimate set by the assignee or manager.
- The estimate is compared to actual tracked time to show over/under capacity.

### 10.3 Timesheets
- A weekly view showing all time logged across tasks by a user.
- Managers can view timesheets across the whole team.
- Filterable by date range, member, project, or billable status.

### 10.4 Billable Time
- Time entries can be marked as billable or non-billable.
- Useful for agencies and consultants tracking client-billable hours.

### 10.5 Integrations
- Connects with external time tracking tools: Harvest, Toggl, Clockify, Everhour.

---

## 11. AUTOMATIONS

### 11.1 Purpose
Automations reduce manual, repetitive work by triggering actions when certain conditions are met — no code required.

### 11.2 Automation Structure
Every automation has three components:
- **Trigger** — The event that starts the automation (e.g., "When a task status changes to Done").
- **Condition** — Optional filter to narrow when the automation fires (e.g., "Only if priority is High").
- **Action** — What happens as a result (e.g., "Send email notification", "Assign to a specific person").

### 11.3 Trigger Types
- Task created
- Task status changed
- Task priority changed
- Due date arrives or passes
- Assignee added or removed
- Comment posted on task
- Custom field value changes
- Task moved to a different List
- Form submitted
- Date-based (schedule: every Monday at 9am)

### 11.4 Action Types
- Change task status
- Change task priority
- Assign task to a member
- Move task to another List
- Create a new task
- Create a subtask
- Post a comment on a task
- Send an email (to a workspace member or external email)
- Send a Slack message (via Slack integration)
- Send a webhook to an external URL
- Apply a template to a task

### 11.5 Pre-built Automation Templates
- A library of common automation recipes is available (e.g., "When task is completed, notify the manager", "When due date passes, set priority to Urgent").

---

## 12. FORMS

### 12.1 Purpose
Forms collect structured input from internal team members or external people and automatically convert submissions into tasks.

### 12.2 Form Builder
- Drag-and-drop form builder.
- Add input fields that map to task fields: text, number, dropdown, date, file upload, email, phone, rating.
- Fields can be marked as required or optional.
- Custom branding: form title, description, logo, and background color.

### 12.3 Submission Behavior
- Each form submission automatically creates a new task in a specified List.
- Field values from the form pre-fill the task fields.
- A confirmation message is shown to the submitter after submission.
- Submissions can trigger automations (e.g., assign the new task to a review queue).

### 12.4 Sharing
- Forms have a unique shareable URL that can be sent to anyone, including people without a ClickUp account.
- Can also be embedded in an external website via iframe.

---

## 13. WHITEBOARDS

### 13.1 Purpose
A freeform visual canvas for brainstorming, diagramming, and collaborative thinking — embedded directly in the workspace.

### 13.2 Canvas Features
- Infinite canvas with pan and zoom.
- **Sticky notes** — Color-coded notes for brainstorming.
- **Shapes** — Rectangles, circles, triangles, diamonds, arrows, lines, connectors.
- **Text boxes** — Add free-floating text anywhere on the canvas.
- **Images** — Upload or drag images onto the canvas.
- **Freehand drawing** — Pen tool for handwritten annotations.
- **Connectors** — Draw connecting lines between any elements to create flowcharts or mind maps.
- **Task cards** — Embed live task cards directly on the whiteboard; changes sync to the real task.
- **Templates** — Start from a pre-built template (retrospective, flowchart, org chart, user story map, etc.).

### 13.3 Collaboration
- Multiple users edit the same whiteboard simultaneously.
- Each user's cursor is visible with their name.
- Comments can be pinned to specific areas of the canvas.

---

## 14. SPRINTS

### 14.1 Purpose
Sprint management for agile development teams running iterative work cycles.

### 14.2 Sprint Structure
- Sprints are created inside a Space or Folder as a special type of List.
- Each sprint has a name, start date, and end date.
- Tasks are added to a sprint from the backlog.

### 14.3 Sprint Features
- **Backlog** — A holding area for unprioritized tasks outside of any sprint.
- **Velocity tracking** — Measures how many story points or tasks are completed per sprint.
- **Burndown chart** — Shows remaining work (tasks or points) over the sprint duration. The chart updates in real time as tasks are completed.
- **Sprint reports** — Summary of completed, incomplete, and carried-over tasks at sprint end.
- **Auto-close** — When a sprint ends, incomplete tasks can be automatically moved to the next sprint or back to the backlog.

### 14.4 Story Points
- Tasks in a sprint can be assigned story points as a custom field.
- Story points are used to measure team velocity across sprints.

---

## 15. PORTFOLIOS

### 15.1 Purpose
A high-level view of multiple projects running simultaneously, giving managers and leadership visibility across the portfolio without drilling into individual tasks.

### 15.2 Portfolio View
- Each row in the Portfolio represents one List or project.
- Columns show: project name, overall completion percentage, health status, owner, due date, and key custom fields.
- A progress bar per project shows how many tasks are complete vs. total.
- Color-coded health status (On Track / At Risk / Off Track) can be set manually or auto-calculated.

---

## 16. INBOX

### 16.1 Purpose
A centralized notification hub where every update, mention, assignment, and comment that requires the user's attention is collected.

### 16.2 Inbox Features
- Grouped by notification type: assigned to me, @mentioned, task updates, comments.
- Each notification links directly to the task, doc, or comment that triggered it.
- Mark as done, snooze, or archive notifications.
- **Today view** — Tasks with due dates today and tasks that are overdue surface automatically.
- **Triage mode** — Swipe or keyboard-shortcut through notifications to act on them quickly.

---

## 17. CLICKUP BRAIN (AI)

### 17.1 What It Is
ClickUp Brain is the native AI layer embedded across the entire workspace. It uses the context of your actual work — tasks, docs, comments, people — to answer questions and take actions without needing to be briefed.

### 17.2 AI Q&A
- Ask any question in natural language and Brain searches across the workspace to answer it.
- Example: "What's the status of the rebrand project?" or "What did the team decide about the API migration?"
- Answers include references to the specific tasks, docs, or comments where the information came from.

### 17.3 AI Writing
- Generate or rewrite content inside any task description, comment, or Doc.
- Actions: summarize, expand, shorten, change tone, fix grammar, translate.
- Generate a full task description from just a title.
- Auto-generate subtasks from a task description.

### 17.4 AI Summaries
- Summarize a task thread (all comments + activity) into a brief update.
- Summarize a Doc into key points.
- Generate a standup update for a team member based on their recent task activity.

### 17.5 AI Status Updates
- Brain generates a project status update (what's done, what's in progress, what's blocked) by reading all tasks in a List or Folder.
- Updates are formatted and ready to paste into Slack, email, or a Doc.

### 17.6 BrainGPT (Model Selection)
- Brain runs on a proprietary orchestration layer (BrainGPT) that selects the best underlying AI model (GPT, Claude, Gemini) for each type of request.
- One subscription gives access to all models, routed automatically by intent.
- Zero data retention and zero model training on user data — more secure than using AI providers directly.

### 17.7 Memory and Personalization
- Brain learns user preferences over time: preferred tone, writing style, report format, timezone, team terminology.
- Stored as a "memory" that can be viewed and edited by the user.
- Multiplayer AI: the more the team uses Brain, the more it knows about the team's patterns and language.

### 17.8 Connected Apps (MCP)
- Brain connects to external tools via Model Context Protocol (MCP): Google Drive, GitHub, Salesforce, Slack, Figma, and 50+ more.
- Answers and actions draw from connected app data in addition to the ClickUp workspace.

### 17.9 Deep Search
- Cross-workspace + web search for complex questions.
- Searches tasks, docs, connected apps, and the internet to compile a comprehensive answer.

### 17.10 Ambient Intelligence
- Surfaces relevant tasks, related context, and smart suggestions proactively — before the user asks.
- Example: Opening a task automatically shows related tasks, recent team discussions, and linked docs.

---

## 18. SUPER AGENTS (AI TEAMMATES)

### 18.1 What They Are
Super Agents are AI-powered teammates that live inside the ClickUp workspace. They are not chatbots — they take real action, execute multi-step workflows end-to-end, and operate autonomously with persistent memory.

### 18.2 How to Interact with an Agent
- **@mention** — Tag an agent anywhere in a chat message, task comment, or doc to summon them.
- **Assign** — Delegate a task to an agent directly from the task assignee field, just like a human.
- **Message** — Chat with an agent in a direct message thread to give instructions, ask questions, or review output.

### 18.3 Agent Capabilities (500+ Skills)
Agents can perform actions including but not limited to:
- Draft and send emails
- Create, assign, and update tasks
- Post comments on tasks or chat channels
- Schedule calendar events and send invites
- Generate reports and summaries
- Write and review code
- Search the web or connected apps for information
- Update CRM records
- Conduct research and compile findings into a Doc
- Build forms and process submissions
- Translate documents
- Analyze data and produce charts
- Track expenses and invoices
- Monitor keywords or trends

### 18.4 Agent Memory
- **Short-term memory** — Context from the current conversation or session.
- **Long-term memory** — Stored facts and preferences about the user and team, persisted across sessions.
- **Episodic memory** — Records of past completed jobs, used to learn from experience.
- Memory is updated automatically and can be viewed or edited by the user.

### 18.5 Agent Knowledge
- Agents have access to the entire ClickUp workspace (permissions-aware — they only see what they're allowed to see).
- Connected to 50+ external apps via real-time syncing engine.
- Agents automatically update internal knowledge bases when decisions, updates, or changes happen.

### 18.6 Ambient Agents
- Agents that run silently in the background without being summoned.
- Monitor for specific triggers (e.g., a new form submission, a task moving to a specific status, a keyword appearing in chat) and act automatically.
- Examples:
  - **Intake Agent** — Monitors a form and standardizes incoming project requests into structured tasks.
  - **Assign Agent** — Reviews new tasks and auto-assigns them to the right person based on type and workload.
  - **PM Agent** — Monitors deliverables and timelines, flags delays, and sends progress updates.
  - **Triage Agent** — Watches for new bug reports and prioritizes them by severity.
  - **Brief Agent** — Creates a campaign brief when a new marketing project task is created.

### 18.7 Agent Security
- Agents inherit the same permission model as human users.
- Explicit permissions can be set: what data an agent can read, what actions it can take.
- Full audit trail of every action an agent performed (what it did, when, on which task or channel).
- Zero data retention and zero training on workspace data.

### 18.8 Agent Analytics
- Dashboard showing agent productivity: tasks completed, time saved, actions taken.
- Workload view across the team showing human vs. agent contribution.
- Top performer leaderboard (tracks which agents and humans complete the most work).

### 18.9 Building Custom Agents
- No-code agent builder: describe the agent's job in plain language.
- Define the agent's trigger, knowledge sources, permissions, and action set.
- An entire team of agents can be spun up from a single prompt that maps goals, workflows, and pain points to specialized agents automatically.
- A public Agent Catalog/Templates library provides pre-built agents for common roles (PM Agent, Sales Agent, Developer Agent, Content Agent, HR Agent, etc.).

### 18.10 Self-Learning
- Every completed task and piece of human feedback makes agents better.
- Reflection loops: agents review completed work and assess quality before finalizing.

---

## 19. AI NOTETAKER

### 19.1 Purpose
Automatically records, transcribes, and summarizes meetings so team members can stay present in the conversation.

### 19.2 Features
- Joins meetings automatically (Google Meet, Zoom, Microsoft Teams).
- Produces a full transcript of the meeting.
- Generates a structured summary: key decisions, action items, and next steps.
- Action items are automatically converted into tasks in ClickUp, assigned to the right person.
- The recording, transcript, and summary are stored in ClickUp and linked to relevant projects or tasks.

---

## 20. ENTERPRISE SEARCH

### 20.1 Purpose
A single search bar to find anything across ClickUp and all connected applications.

### 20.2 What It Searches
- All ClickUp content: tasks, docs, comments, goals, dashboards, people.
- Connected apps: Google Drive, Slack, GitHub, Salesforce, Figma, Notion, and 50+ more.
- Search results are permissions-aware — users only see content they have access to.

### 20.3 Search Features
- Natural language queries: "Show me all tasks assigned to Sarah due this week" or "Find the API documentation doc."
- Results are ranked by relevance and recency.
- Filter results by source app, content type, or date.

---

## 21. INTEGRATIONS AND API

### 21.1 Native Integrations (100+)
ClickUp connects natively with tools including:
- **Communication:** Slack, Microsoft Teams, Zoom, Loom
- **Development:** GitHub, GitLab, Bitbucket, Figma, Sentry
- **Productivity:** Google Drive, Google Docs, Dropbox, OneDrive
- **CRM & Sales:** Salesforce, HubSpot, Pipedrive
- **Time tracking:** Harvest, Toggl, Clockify
- **Support:** Zendesk, Intercom
- **Email:** Gmail, Outlook
- **Calendar:** Google Calendar, Outlook Calendar

### 21.2 REST API
- Full public REST API with endpoints for all major resources: workspaces, spaces, folders, lists, tasks, comments, custom fields, users, time entries, goals, and more.
- Supports OAuth 2.0 for user-level API access and API tokens for personal access.
- Webhook support for subscribing to real-time events.
- Rate limited per workspace tier.

### 21.3 Import
- Import data from: Asana, Jira, Monday.com, Trello, Notion, Wrike, Todoist, Basecamp, and CSV.
- Importer maps source data to ClickUp fields and previews the result before committing.

---

## 22. PROOFING

### 22.1 Purpose
Review and annotate creative assets (images, PDFs, videos) directly inside ClickUp without exporting to an external review tool.

### 22.2 Features
- Upload an image or PDF to a task as an attachment.
- Click anywhere on the asset to pin a comment to that exact location.
- Comments are threaded and can be resolved when addressed.
- Annotators can draw shapes or arrows directly on the asset to indicate the specific area.
- Version comparison: upload a revised version and compare it against the previous one side by side.
- Reviewers can approve or request changes directly from the proofing view.

---

## 23. PERMISSIONS AND SECURITY

### 23.1 Permission Levels
- **Owner** — Full control over the workspace including billing and member management.
- **Admin** — Can manage all settings, members, and content.
- **Member** — Standard access to create, edit, and comment on tasks.
- **Viewer** — Read-only access to content.
- **Guest** — External user with access limited to specific Spaces, Folders, or Lists they are explicitly invited to.

### 23.2 Granular Permission Controls
- Permissions can be set at the Workspace, Space, Folder, List, or individual task level.
- Specific features can be enabled or disabled per Space (e.g., disable time tracking in a Space used by non-billable teams).

### 23.3 Single Sign-On (SSO)
- Support for SAML-based SSO with identity providers: Okta, Azure AD, Google Workspace, OneLogin.
- Force SSO enforcement for all workspace members.

### 23.4 Security Certifications
- SOC 2 Type II Certified
- ISO 27001 Certified
- GDPR Compliant
- HIPAA Compliant

### 23.5 Data Privacy
- Zero data retention on third-party AI model providers — ClickUp data is never used to train external AI models.
- All data encrypted in transit (TLS) and at rest (AES-256).

---

## 24. NOTIFICATIONS

### 24.1 Notification Triggers
Users receive notifications when:
- They are assigned to a task
- They are @mentioned in a comment or doc
- A task they are watching changes status
- A comment is added to a task they own or are assigned to
- A task they own is nearing or past its due date
- An automation fires and involves them
- An agent completes a task assigned to them

### 24.2 Notification Channels
- In-app (Inbox)
- Email
- Mobile push notification (iOS and Android)
- Slack (via integration)
- Microsoft Teams (via integration)

### 24.3 Notification Preferences
- Users control which event types trigger which notification channels.
- Do Not Disturb mode with scheduled quiet hours.

---

## 25. TEMPLATES

### 25.1 Purpose
Reusable blueprints for common workflows so teams don't rebuild structures from scratch.

### 25.2 Template Types
- **Task templates** — Pre-configured task with default assignee, fields, checklists, and subtasks.
- **List templates** — A full List with pre-created tasks, statuses, and custom fields.
- **Space templates** — Entire Space structure with multiple Lists and Folders.
- **Doc templates** — Pre-written document structure for recurring doc types (meeting notes, project brief, PRD, retrospective).
- **Whiteboard templates** — Pre-built canvas layouts (retrospective, flowchart, roadmap).

### 25.3 Template Library
- ClickUp provides a public library of 1,000+ templates across categories: marketing, engineering, HR, sales, operations, design, and more.
- Teams can create and save their own custom templates from any existing List, Space, or Doc.

---

## 26. ROLES AND TEAMS

### 26.1 Teams
- Groups of users that can be assigned to tasks as a unit.
- Instead of assigning five individual people, assign the "Design Team" and all five members receive the task.

### 26.2 Custom Roles
- Workspace owners can define custom roles with specific permission sets.
- Assign roles to members instead of configuring permissions individually.

---

## CODE GENERATION INSTRUCTIONS

When generating code based on this specification, follow these rules:

1. **Build modular components** — Each feature section (Tasks, Docs, Chat, etc.) should map to a self-contained module or service.
2. **Data model first** — Before building UI, define the database schema or data types for each entity described in this spec (Task, Space, List, Tag, Goal, Sprint, Agent, etc.).
3. **Feature flags** — Use feature flags for AI features (Brain, Super Agents) so they can be toggled independently.
4. **Permission checks** — Every data read and write operation must check the permission level of the authenticated user against the resource being accessed.
5. **Real-time first** — Chat, Whiteboard, and Doc editing require WebSocket connections for real-time multiplayer. Design the architecture with this in mind from the start.
6. **View system** — The multi-view system (List, Board, Gantt, Calendar, etc.) should be a pluggable view layer on top of the same task data store — not separate data fetches.
7. **Automations engine** — The automation system should be event-driven. Triggers fire events into a queue; the automation engine processes them against condition rules and dispatches actions.
8. **Agent architecture** — Agents are separate services with their own memory store, knowledge index, and skill registry. They communicate with the main workspace via the API and WebSocket events.
9. **API-first** — Build the REST API first; all UI should consume the same API endpoints.
10. **Notifications** — Design a central notification service that all other modules publish events to. The notification service fans out to the correct channels (in-app, email, push) based on user preferences.
