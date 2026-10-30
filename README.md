# AAVIL ERP

A React + TypeScript frontend for employee, leave, project, timesheet, payroll, and appraisal workflows. The frontend lives at the repository root; the separate Fastify API and Supabase PostgreSQL backend live in [`backend/`](./backend/). Authentication, employee, leave, project, timesheet, payroll, and appraisal records are stored in Supabase.

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

   The seed script creates an account from `SEED_USER_*` settings if it does not exist, then creates its linked employee profile. For an existing account it does not change the password or account details; it only adds the missing profile. To seed another account, set a different email and run it again.

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
- `GET /api/employees` — administrators see all employee records; employees see only their linked profile
- `GET /api/employees/:id` — administrators can view any profile; employees can view only their own
- `POST /api/employees` — administrators create employee records
- `PATCH /api/employees/:id` — administrators update employee records
- `GET /api/leave-requests` — administrators see all requests; employees see their own requests and balance
- `GET /api/leave-requests/policy` — returns the company leave allowances
- `GET /api/leave-requests/policy/history` — administrators view recent allowance changes
- `PUT /api/leave-requests/policy` — administrators update company leave allowances
- `POST /api/leave-requests` — submit a leave request from the linked employee account
- `PATCH /api/leave-requests/:id/review` — administrators approve or reject a pending request
- `GET /api/projects` — administrators see all projects; employees see their assigned projects
- `POST /api/projects` — administrators create projects and assign project team members
- `POST /api/projects/:id/tasks` — administrators create tasks and assign them to project team members
- `PATCH /api/projects/:projectId/tasks/:taskId` — administrators update or reassign a task; employees update only tasks assigned to them
- `GET /api/timesheets` — employees see their timesheets; administrators see all weekly work reports
- `POST /api/timesheets` — create a weekly draft or submit daily hours, per-day work descriptions, and a weekly summary
- `PATCH /api/timesheets/:id` — edit a draft or returned report and optionally resubmit it
- `PATCH /api/timesheets/:id/review` — administrators approve or return a submitted weekly report with a note
- `GET /api/payroll` — administrators see all payroll records; employees see only their own
- `GET /api/payroll/:id` — retrieve an authorized payroll record
- `POST /api/payroll/runs` — administrators create a pay-period run with manually entered payroll figures
- `PATCH /api/payroll/:id/status` — administrators update a payroll record's status
- `GET /api/appraisals` — administrators see all reviews; employees see only their own
- `POST /api/appraisals/cycles` — administrators create a review for every active employee
- `PATCH /api/appraisals/:id/self-assessment` — employees submit their own self-assessment
- `PATCH /api/appraisals/:id/admin-review` — administrators rate four performance areas and complete submitted self-reviews
- `GET /api/resignations` — employees see their applications; administrators see all applications
- `POST /api/resignations` — an employee submits a resignation request with at least 30 calendar days' notice
- `PATCH /api/resignations/:id/review` — an administrator approves or rejects a pending request
- `GET /api/notifications` — returns the signed-in user's enabled in-app notifications
- `GET /api/notifications/preferences` — returns the signed-in user's notification preferences
- `PUT /api/notifications/preferences` — saves all five notification preference toggles
- `PATCH /api/notifications/read` — marks the signed-in user's notifications as read
- `POST /api/accounts/employees/:employeeId/access-link` — administrators issue a one-time setup or password-reset link
- `GET /api/accounts/employees/:employeeId/documents` — administrators list an employee's uploaded document metadata
- `GET /api/accounts/employees/:employeeId/documents/:documentId` — administrators download a private employee document
- `PATCH /api/accounts/employees/:employeeId/active` — administrators activate or deactivate employee login access
- `POST /api/accounts/complete-setup` — consume an employee access link, set a password, and submit onboarding details/documents
- `POST /api/accounts/onboarding` — an authenticated incomplete employee submits onboarding details/documents
- `GET /api/accounts/my-documents` — an employee lists their own onboarding documents
- `GET /api/accounts/my-documents/:documentId` — an employee views their own private onboarding document
- `PUT /api/accounts/my-documents/:documentType` — an employee replaces one of their onboarding documents
- `GET /api/accounts/admins` — the company owner lists administrator accounts
- `POST /api/accounts/admins/invitations` — the owner creates an HR admin account and one-time setup invitation
- `POST /api/accounts/admins/:adminId/invitation` — the owner reissues a pending invitation, invalidating the previous link
- `PATCH /api/accounts/admins/:adminId/active` — the owner deactivates or reactivates a completed HR admin account
- `POST /api/accounts/complete-admin-setup` — consume a valid HR invitation and set a password

Passwords are stored as bcrypt hashes. Session tokens are random, stored hashed in Supabase PostgreSQL, and sent to the browser only in an HTTP-only cookie. The cookie is `Secure` in production. Login and password recovery are rate limited.

Employee records are stored separately from login accounts. Creating an employee record does not create login credentials; an existing employee-role user with the same email is linked automatically. The seed command also creates or completes the seeded account's employee profile.

Leave requests are stored in PostgreSQL. The API counts weekdays (Monday–Friday, inclusive) and does not account for public holidays. HR administrators configure company annual, sick, and casual allowances in **Settings → Leave Policy**; balances renew on January 1 without automatic carry-forward, changing an allowance preserves days already used in the current year, and new employees receive the current allowances. Requests spanning calendar years are charged to each year's balance by weekday. Policy changes are recorded with the administrator and timestamp. Pending requests are displayed separately and reserved when submitting further requests; approved annual, sick, and casual leave is deducted atomically from the balance. Maternity/paternity and unpaid leave do not deduct those balances.

Projects, project-team memberships, project tasks, timesheets, and timesheet entries are stored in PostgreSQL. Administrators create and assign project tasks to team members; employees update their assigned task status and progress note, and explain blockers. Project progress is calculated from completed tasks rather than manually entered. Project budgets are displayed in Indian rupees (₹); only administrators can see them. Employees record weekly hours against assigned active projects, with a work description required for each project/day with logged hours. A weekly report also requires a completed-work summary and next-week focus before submission; blockers are optional, and drafts can be incomplete. Administrators can filter, review, approve or return reports, and download the selected reports as a two-sheet Excel workbook with weekly summaries and daily work details. Hours are validated to a maximum of 24 per person per day.

Payroll runs and employee records are stored in PostgreSQL. Payroll amounts are entered by administrators; the API calculates gross earnings, deductions, and net pay and limits employees to viewing their own records. No tax rules, bank transfers, or payment-provider integrations are implemented; marking a record as paid is only a status update.

Performance reviews are stored in PostgreSQL. Administrators start a named cycle for all active employees; employees submit a reflection, achievements, challenges, and goals for the next period without giving themselves a score. An administrator then rates delivery, quality, ownership/reliability, and collaboration on a consistent 1–5 scale and provides evidence-based written feedback. The overall score is the average of those four administrator ratings, rounded to one decimal place. Employees can view only their own reviews. Migration `0014` changes existing in-progress manager-review records to admin-review status and preserves completed historical ratings as previous single ratings.

Resignation applications are stored in PostgreSQL. Employees submit a proposed last working day with a 30-calendar-day minimum notice period; active administrators receive an in-app notification. Administrators approve or reject requests, and employees can track the decision and notice period. If an application remains pending for seven days, the API's hourly background sweep sends an in-app escalation notification to all active administrators, including the company owner. The request remains pending until an administrator decides; silence never approves a resignation or changes the employee's account status.

Employee login accounts are provisioned only by administrators; public signup is not available. From the employee directory an administrator can create a one-time setup link for an employee without an account, or a password-reset link for an existing employee account. These administrator-issued links expire after 24 hours and can be used once. The sign-in page also offers self-service password recovery for active employee and administrator accounts. It sends a one-time link that expires after 60 minutes; completing the reset revokes the account's existing sessions. To enable email recovery, set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (a sender verified with Resend), and `APP_BASE_URL` in the backend environment. Keep the API key private and never expose it as a frontend environment variable. Until email is configured, self-service requests explain that recovery is unavailable and employees can ask an administrator to issue a reset link. Deactivating an employee account revokes its active sessions; marking the employee record inactive also disables its linked employee login.

On their first account setup, employees choose their password and provide their full name, date of birth, contact number, offer letter, educational certificates, and government ID proof. Existing employee accounts are also required to complete this flow after migration `0011`; incomplete employees cannot use the application until they submit the form. Documents are stored as private PostgreSQL `bytea` data, limited to PDF/JPG/PNG files up to 5 MB each and 15 MB total. They are never exposed as public file URLs; authenticated administrators can download them from an employee profile. Database access and backups must be protected according to the sensitivity of government ID documents.

The first existing administrator (oldest account) is designated as the single company owner by migration `0010`; on a new database, the first seeded admin becomes the owner. In **HR Admin Access**, the owner can invite HR teammates, resend pending invitations, and deactivate or reactivate their accounts. Invitations are emailed when Resend is configured; otherwise, the owner can copy and share the displayed one-time setup link. HR admin invitations expire after 24 hours, and deactivation revokes that account's sessions. HR admins share the current administrator permissions; the app does not yet provide per-module permission settings or support multiple company workspaces.

Two-factor authentication is not implemented. Do not use payroll data as official tax or payment records without jurisdiction-specific review.

## Schema changes

After changing the Drizzle schema in [`backend/src/db/schema.ts`](./backend/src/db/schema.ts), generate a migration and apply it:

```powershell
corepack pnpm db:generate
corepack pnpm db:migrate
```

Migrations are applied in order from `backend/drizzle/` by `corepack pnpm db:migrate`; do not paste SQL into the Supabase SQL Editor when using this command. Phase 5 adds payroll tables, Phase 6 adds appraisal review records, Phase 7 adds one-time account-access tokens, password recovery adds expiring reset-token records, migration `0010` adds owner-managed HR admin invitations, migration `0011` adds employee onboarding and private document storage, migration `0012` adds resignation applications, migration `0013` adds notification preferences and notification categories, migration `0014` adds structured appraisal ratings and updates the review stage label, migration `0015` adds project tasks, migration `0016` adds weekly work report summaries and per-day timesheet descriptions, migration `0017` adds configurable company leave allowances and policy history, and migration `0018` adds annual employee leave balances and backfills the current calendar year. Apply migrations with `corepack pnpm db:migrate` before using the company leave policy settings.

Notification preferences are stored per account on the server and applied to leave, timesheet, onboarding, appraisal-cycle, and project milestone/assignment notifications. Disabled categories are not added to the user's in-app notification feed. Appraisal cycles collect an employee reflection, achievements, challenges, and next-period goals; an administrator then rates delivery, quality, ownership/reliability, and collaboration. The displayed overall appraisal score is the average of those four administrator ratings, not an employee self-rating.


## Netlify deployment

Use the repository root as the base directory, 'corepack pnpm install --frozen-lockfile && corepack pnpm build' as the build command, and 'dist' as the publish directory. The checked-in 'netlify.toml' proxies '/api/*' to the Render API.
