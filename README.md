# AAVIL ERP

A React + TypeScript frontend for employee, attendance, leave, project, timesheet, payroll, and appraisal workflows. The frontend lives at the repository root; the separate Fastify API and Supabase PostgreSQL backend live in [`backend/`](./backend/). Authentication, employee, attendance, leave, project, timesheet, payroll, and appraisal records are stored in Supabase.

## Requirements

- Node.js 22.12 or newer
- pnpm through Corepack (`corepack pnpm ...`)
- A Supabase project with a PostgreSQL database

## Local setup

1. Create a Supabase project. In the Supabase dashboard, open **Connect** and copy a PostgreSQL connection string. For a local Node.js server, use the **Session pooler** connection option if the direct connection is unavailable on your network or IPv4-only environment.
2. In PowerShell, run `Copy-Item backend\.env.example backend\.env`, then edit `backend\.env`. Set `DATABASE_URL` to the Supabase PostgreSQL connection string and replace the seed password with a unique password of at least 12 characters (maximum 72 UTF-8 bytes for bcrypt). Keep the file private and do not commit it. If the database password contains URL-special characters, use Supabase's URI-encoded connection string or percent-encode those characters.
3. Install dependencies:

   ```powershell
   corepack pnpm install
   ```

4. Apply the checked-in database migrations and create or complete the seeded account's employee profile:

   ```powershell
   corepack pnpm db:migrate
   corepack pnpm db:seed
   ```

   The seed script creates the initial HR account from `SEED_USER_*` settings if it does not exist, then creates its linked employee profile. For an existing account it does not change the password or account details; it only adds the missing profile. Employee login accounts should be created by HR from the employee directory, not by running the seed command.

5. Start the frontend and API:

   ```powershell
   corepack pnpm dev:all
   ```

   Open the Vite URL printed in the terminal (usually <http://localhost:5173>). The frontend proxies `/api` requests to the API on port 3001. The health endpoint is <http://localhost:3001/api/health>.

If `corepack enable` fails due to Windows permissions, do not enable global shims; use `corepack pnpm` as shown above. If pnpm is unavailable, install pnpm for your user.

## API

- `GET /api/health` — database connectivity check
- `POST /api/auth/login` — verifies the account password and creates a server-side session
- `POST /api/auth/forgot-password` — sends a single-use reset link to an active account's email
- `POST /api/auth/reset-password` — changes the password using a valid one-time reset token
- `GET /api/auth/me` — returns the signed-in user
- `PATCH /api/auth/profile/avatar` — updates the signed-in user's profile photo with a PNG, JPEG, or WebP image up to 5 MB
- `POST /api/auth/logout` — revokes the session
- `GET /api/attendance?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&employeeId=<uuid>` — employees see their own attendance; HR can filter all employee records by date and employee
- `POST /api/attendance/clock-in` — start an attendance session for the signed-in user's linked employee profile
- `POST /api/attendance/clock-out` — end the signed-in user's open attendance session
- `PATCH /api/attendance/:id` — HR correct clock times with a required reason; previous and new values are kept in the audit history
- `GET /api/employees` — HR see all employee records; employees see only their linked profile
- `GET /api/employees/:id` — HR can view any profile; employees can view only their own
- `POST /api/employees` — HR create employee records
- `PATCH /api/employees/:id` — HR update employee records
- `GET /api/leave-requests` — HR see all requests; employees see their own requests and balance
- `GET /api/leave-requests/holidays` — authenticated users view company holidays
- `POST /api/leave-requests/holidays` — HR publish a company-wide holiday or date range
- `PATCH /api/leave-requests/holidays/:id` — HR update a holiday; overlapping holidays are rejected
- `DELETE /api/leave-requests/holidays/:id` — HR remove a holiday
- `GET /api/leave-requests/policy` — returns the company leave allowances
- `GET /api/leave-requests/policy/history` — HR view recent allowance changes
- `PUT /api/leave-requests/policy` — HR update company leave allowances
- `POST /api/leave-requests` — submit a leave request from the linked employee account
- `PATCH /api/leave-requests/:id/review` — HR approve or reject a pending request
- `GET /api/projects` — HR see all projects; employees see their assigned projects
- `POST /api/projects` — HR create projects and assign project team members
- `PUT /api/projects/:id/members` — HR add or remove project team members; members with unfinished tasks must be reassigned or have those tasks completed first
- `POST /api/projects/:id/tasks` — HR create tasks and assign them to project team members
- `PATCH /api/projects/:projectId/tasks/:taskId` — HR update or reassign a task; employees update only tasks assigned to them
- `GET /api/timesheets` — employees see their timesheets; HR see all weekly work reports
- `POST /api/timesheets` — create a weekly draft or submit daily hours, per-day work descriptions, and a weekly summary
- `PATCH /api/timesheets/:id` — edit a draft or returned report and optionally resubmit it
- `PATCH /api/timesheets/:id/review` — HR approve or return a submitted weekly report with a note
- `GET /api/payroll` — HR see all payroll records; employees see only their own
- `GET /api/payroll/:id` — retrieve an authorized payroll record
- `POST /api/payroll/runs` — HR create a pay-period run with manually entered payroll figures
- `PATCH /api/payroll/:id` — HR edit a draft or issue an audited correction to a published payslip
- `PATCH /api/payroll/:id/publish` — HR publish a draft payslip and notify the employee
- `PATCH /api/payroll/:id/status` — HR update the payment status of a published payroll record
- `GET /api/appraisals` — HR see all reviews; employees see only their own
- `POST /api/appraisals/cycles` — HR create a review for every active employee
- `PATCH /api/appraisals/:id/self-assessment` — employees submit their own self-assessment
- `PATCH /api/appraisals/:id/admin-review` — HR rate four performance areas and complete submitted self-reviews
- `GET /api/resignations` — employees see their applications; HR see all applications
- `GET /api/resignations/policy` — authenticated users view the company notice period
- `PUT /api/resignations/policy` — HR configure the standard notice period and pending-review escalation timing
- `GET /api/resignations/policy/history` — HR view recent notice-period policy changes
- `GET /api/resignations/reviewers` — HR list active HR eligible to own a pending review
- `POST /api/resignations` — an employee submits a resignation request using the current standard calendar-day notice period
- `PATCH /api/resignations/:id/review` — HR approve or reject a pending request; approval may set a different confirmed last day and requires a review note if it differs from the employee's proposed date
- `PATCH /api/resignations/:id/assignment` — HR assign or unassign a pending request to an active HR
- `PATCH /api/resignations/:id/checklist/:itemId` — HR update an approved resignation's offboarding task, responsible party, due date, or note
- `GET /api/notifications` — returns the signed-in user's enabled in-app notifications
- `GET /api/notifications/preferences` — returns the signed-in user's notification preferences
- `PUT /api/notifications/preferences` — saves all five notification preference toggles
- `PATCH /api/notifications/read` — marks the signed-in user's notifications as read
- `POST /api/accounts/employees/:employeeId/access-link` — HR issues a one-time setup or password-reset link and emails it to the employee when email is configured
- `GET /api/accounts/employees/:employeeId/documents` — HR list an employee's uploaded document metadata
- `GET /api/accounts/employees/:employeeId/documents/:documentId` — HR download a private employee document
- `PATCH /api/accounts/employees/:employeeId/active` — HR activate or deactivate employee login access
- `POST /api/accounts/complete-setup` — consume an employee access link, set a password, and submit onboarding details/documents
- `POST /api/accounts/onboarding` — an authenticated incomplete employee submits onboarding details/documents
- `GET /api/accounts/my-documents` — an employee lists their own onboarding documents
- `GET /api/accounts/my-documents/:documentId` — an employee views their own private onboarding document
- `PUT /api/accounts/my-documents/:documentType` — an employee replaces one of their onboarding documents

Passwords are stored as bcrypt hashes. Session tokens are random, stored hashed in Supabase PostgreSQL, and sent to the browser only in an HTTP-only cookie. The cookie is `Secure` in production. Login and password recovery are rate limited.

Employee records are stored separately from login accounts. Creating an employee record does not create login credentials; an existing employee-role user with the same email is linked automatically. HR issues a one-time setup link from the employee directory, and the backend emails it to the employee when `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `APP_BASE_URL` are configured. The link expires after 24 hours and can be used once; if email is unavailable, HR can copy and share the displayed link securely. Public signup and self-selected roles are not available. The company uses one HR account; employee accounts are provisioned by HR.

Leave requests and company holidays are stored in PostgreSQL. HR publish company-wide holidays from **Leaves & Calendar**; employees see them on the shared calendar and receive in-app notifications when holidays are added, changed, or removed. Holiday date ranges cannot overlap. Leave day counts include weekdays only and exclude published company holidays. If a holiday changes dates over existing leave requests, pending/approved request day counts and affected leave balances are recalculated. HR HR configure company annual, sick, and casual allowances in **Settings → Leave Policy**; balances renew on January 1 without automatic carry-forward, changing an allowance preserves days already used in the current year, and new employees receive the current allowances. Requests spanning calendar years are charged to each year's balance by working day. Policy changes are recorded with the HR and timestamp. Pending requests are displayed separately and reserved when employees submit additional requests; approved annual, sick, and casual leave is deducted atomically from the balance. Maternity/paternity and unpaid leave do not deduct those balances.

Attendance records are stored separately from app authentication sessions. Employees explicitly clock in and clock out; an open session is not automatically closed when they sign out of the application, and any missed clock-out remains flagged for review. HR can filter attendance by employee and date, and correct times only with a reason; each correction records the HR, timestamp, reason, and before/after values. Durations are elapsed time between the recorded clock-in and clock-out and do not prove continuous work or subtract breaks. Attendance display and date filtering use `COMPANY_TIME_ZONE` (default `Asia/Kolkata`); set it to a valid IANA timezone in `backend/.env` when the company uses another timezone.

Projects, project-team memberships, project tasks, timesheets, and timesheet entries are stored in PostgreSQL. HR can manage project teams after creation; the project lead cannot be removed, and team members with unfinished assigned tasks must have those tasks reassigned or completed before removal. Added and removed members are notified. HR create and assign project tasks to team members; employees update their assigned task status and progress note, and explain blockers. Project progress is calculated from completed tasks rather than manually entered. Project budgets are displayed in Indian rupees (₹); only HR can see them. Employees record weekly hours against assigned active projects, with a work description required for each project/day with logged hours. A weekly report also requires a completed-work summary and next-week focus before submission; blockers are optional, and drafts can be incomplete. HR can filter, review, approve or return reports, and download the selected reports as a two-sheet Excel workbook with weekly summaries and daily work details. Hours are validated to a maximum of 24 per person per day.

Payroll runs and payslip records are stored in PostgreSQL. HR create editable drafts with master and actual earnings, work days, LOP, and employee payment details; the API calculates gross earnings, deductions, and net pay. HR/admin can maintain an employee's bank name and account number in the employee profile; new payroll records take a snapshot of those details, so later profile edits do not change an existing payslip. Publishing makes a payslip available to its employee and sends an in-app notification. Employees can view and download only their own published, color-formatted PDF payslips. Published changes require a correction note and preserve the previous revision snapshot. No tax rules, bank transfers, or payment-provider integrations are implemented; marking a record as paid is only a status update. Sensitive bank and tax identifiers are included only in the authorized employee's or HR's payslip.

Performance reviews are stored in PostgreSQL. HR start a named cycle for all active employees; employees submit a reflection, achievements, challenges, and goals for the next period without giving themselves a score. An HR then rates delivery, quality, ownership/reliability, and collaboration on a consistent 1–5 scale and provides evidence-based written feedback. The overall score is the average of those four HR ratings, rounded to one decimal place. Employees can view only their own reviews. Migration `0014` changes existing in-progress manager-review records to admin-review status and preserves completed historical ratings as previous single ratings.

Resignation applications, policy, activity history, and offboarding tasks are stored in PostgreSQL. HR configure a standard notice period of 1–365 calendar days for new requests and a pending-review escalation period of 1–30 days; policy changes do not alter existing applications. Employees see the policy when submitting and must propose a date that meets it. Active HR receive an in-app notification. HR can assign a pending request to an active HR; assignment and reassignment are recorded and the assignee is notified. During approval, HR can confirm a different last working day; a changed date requires a review note, and the original proposed date remains recorded. The activity history records submissions, assignments, decisions, date changes, and checklist updates. Approval creates an offboarding checklist for handover, company-property return, access review/removal, and final paperwork. HR can assign a responsible person or team, due date, status, and note; checklist access removal is a tracked task and does not automatically disable accounts. Employees can track dates, notice duration, review notes, checklist progress, and activity history. If an application remains pending for the configured period, the API's hourly background sweep sends a one-time in-app escalation notification to its assigned reviewer, or all active HR when unassigned. The request remains pending until an HR decides; silence never approves a resignation or changes the employee's account status.

Employee login accounts are provisioned only by HR; public signup is not available. From the employee directory an HR can create a one-time setup link for an employee without an account, or a password-reset link for an existing employee account. These HR-issued links expire after 24 hours and can be used once. The sign-in page also offers self-service password recovery for active employee and HR accounts. It sends a one-time link that expires after 60 minutes; completing the reset revokes the account's existing sessions. To enable email recovery, set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (a sender verified with Resend), and `APP_BASE_URL` in the backend environment. Keep the API key private and never expose it as a frontend environment variable. Until email is configured, self-service requests explain that recovery is unavailable and employees can ask an HR to issue a reset link. Deactivating an employee account revokes its active sessions; marking the employee record inactive also disables its linked employee login.

On their first account setup, employees choose their password and provide their full name, date of birth, contact number, offer letter, educational certificates, and government ID proof. Existing employee accounts are also required to complete this flow after migration `0011`; incomplete employees cannot use the application until they submit the form. Documents are stored as private PostgreSQL `bytea` data, limited to PDF/JPG/PNG files up to 5 MB each and 15 MB total. They are never exposed as public file URLs; authenticated HR can download them from an employee profile. Database access and backups must be protected according to the sensitivity of government ID documents.

The first HR account is marked internally as the owner by migration `0010`; on a new database, the first seeded admin account becomes the HR account. The owner marker is used only to preserve the single HR sign-in and does not provide a separate in-app permission level. HR can create employee records and email employees one-time account setup links. Additional HR invitations and public signup are not supported. Existing extra HR accounts are not deleted, but they can no longer sign in.

Two-factor authentication is not implemented. Do not use payroll data as official tax or payment records without jurisdiction-specific review.

## Schema changes

After changing the Drizzle schema in [`backend/src/db/schema.ts`](./backend/src/db/schema.ts), generate a migration and apply it:

```powershell
corepack pnpm db:generate
corepack pnpm db:migrate
```

Migrations are applied in order from `backend/drizzle/` by `corepack pnpm db:migrate`; do not paste SQL into the Supabase SQL Editor when using this command. Phase 5 adds payroll tables, Phase 6 adds appraisal review records, Phase 7 adds one-time account-access tokens, password recovery adds expiring reset-token records, migration `0010` adds the original owner-managed HR invitation records, migration `0011` adds employee onboarding and private document storage, migration `0012` adds resignation applications, migration `0013` adds notification preferences and notification categories, migration `0014` adds structured appraisal ratings and updates the review stage label, migration `0015` adds project tasks, migration `0016` adds weekly work report summaries and per-day timesheet descriptions, migration `0017` adds configurable company leave allowances and policy history, migration `0018` adds annual employee leave balances and backfills the current calendar year, migration `0023` adds a configurable resignation notice policy and stores the confirmed notice duration, migration `0024` adds resignation activity history, offboarding checklist items, and configurable escalation timing, migration `0025` adds reviewer assignment, migration `0027` adds payroll publication and revision tracking, and migration `0028` adds employee bank details. Apply migrations with `corepack pnpm db:migrate` before using company policies.

Notification preferences are stored per account on the server and applied to leave, timesheet, onboarding, appraisal-cycle, and project milestone/assignment notifications. Disabled categories are not added to the user's in-app notification feed. Appraisal cycles collect an employee reflection, achievements, challenges, and next-period goals; an HR then rates delivery, quality, ownership/reliability, and collaboration. The displayed overall appraisal score is the average of those four HR ratings, not an employee self-rating.
