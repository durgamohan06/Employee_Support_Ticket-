# Employee Support Ticket Management System

Internal web app for employees to report workplace/technical issues and for support staff to manage tickets.

## Technologies

- Frontend: React + TypeScript (Vite)
- Backend: Node.js + Express + TypeScript
- Database: SQLite (`node:sqlite`)
- Auth: signed HTTP-only session cookie and seeded demo users

## Installation

```bash
cd backend && npm install
cd ../frontend && npm install
```

Copy `.env.example` values if you want to override defaults. Set `SESSION_SECRET` before any shared use.

## Run

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Open http://localhost:5173

API: http://localhost:3001/api/health

## Demo accounts

Password for all accounts: `Demo@123`

| Username | Role |
|---|---|
| alex.rivera | Employee |
| jordan.lee | Employee |
| sam.patel | Employee |
| support.agent | Support staff |

## Tests

```bash
cd backend
npm test
```

## Features

- Role-based login and dashboards
- Ticket create, list, details, employee edits, support status workflow
- Ticket comments with backend authorization

## What AI generated

The specification, implementation plan, application code, and automated tests in this lab folder.

## What I personally changed

Fill in during the training review.

## What I tested

Backend Node test coverage for authentication, tickets, comments, and authorization.

## Known limitations

- Demo authentication only; not a production identity system
- No email, attachments, SLA, or ticket assignment
- Support staff change status and comment; they do not edit ticket fields
- Status moves one step forward: Open → In Progress → Resolved → Closed
# Employee_Support_Ticket-
