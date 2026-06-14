# ProjectFlow

A full-stack project management platform for teams to organize workspaces, manage projects, assign and track tasks, collaborate through comments, and monitor progress with built-in analytics.

Built with the MERN stack (MongoDB, Express, React, Node.js) using Redux Toolkit for state management and Tailwind CSS for styling.

## Features

- **Authentication** — JWT-based register/login with hashed passwords (bcrypt)
- **Workspaces** — create workspaces, invite members by email, switch between workspaces
- **Projects** — create, update, delete projects with status, priority, dates, team lead, and team members; auto-calculated progress based on completed tasks
- **Tasks** — full CRUD with status (To Do / In Progress / Done), type (Task, Bug, Feature, Improvement, Other), priority, assignee, and due dates
- **Comments** — discussion thread on each task
- **Activity feed** — automatic activity logging for workspace, project, and task events
- **Analytics** — charts for task status, type, and priority breakdown per project
- **Calendar view** — monthly calendar with upcoming and overdue tasks per project
- **Email invitations** — invite users to a workspace or a specific project via emailed invite links, with an accept-invite flow for new and existing users
- **Dark mode** — theme toggle persisted across sessions
- **Protected routes** — client-side route guarding based on auth state

## Tech Stack

### Frontend
- React (Vite)
- React Router
- Redux Toolkit
- Tailwind CSS
- Recharts (analytics charts)
- date-fns (date formatting/calendar logic)
- Axios (API client with auth interceptors)
- React Hot Toast (notifications)
- Lucide React (icons)

### Backend
- Node.js + Express 5
- MongoDB + Mongoose
- JSON Web Tokens (jsonwebtoken)
- bcryptjs (password hashing)
- SendGrid (transactional email — see [Email Setup](#email-setup))
- CORS, dotenv

## Project Structure

```
project-root/
├── client/
│   └── src/
│       ├── api/            # Axios instance + API service functions
│       ├── app/            # Redux store configuration
│       ├── components/     # Reusable UI components (dialogs, cards, sidebars, charts)
│       ├── features/       # Redux slices (auth, workspace, theme)
│       ├── pages/           # Route-level pages (Dashboard, Projects, Team, etc.)
│       └── assets/          # Images and static assets
│
└── server/
    ├── config/             # Database connection
    ├── controllers/        # Route handlers (auth, workspace, project, task, activity)
    ├── middleware/          # Auth middleware (JWT verification)
    ├── models/             # Mongoose schemas (User, Workspace, Project, Task, etc.)
    ├── routes/             # Express route definitions
    ├── utils/              # Helper functions (sendEmail, createActivity, updateProjectProgress)
    └── server.js           # App entry point
```

## Getting Started

### Prerequisites

- Node.js v20 or higher
- A MongoDB Atlas cluster (or local MongoDB instance)
- A SendGrid account for sending invitation emails (free tier is sufficient)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/<your-username>/<your-repo>.git
   cd <your-repo>
   ```

2. Install backend dependencies

   ```bash
   cd server
   npm install
   ```

3. Install frontend dependencies

   ```bash
   cd ../client
   npm install
   ```

### Environment Variables

Create a `.env` file inside the `server` directory:

```env
PORT=5000

# MongoDB connection string
MONGO_URI=your_mongodb_connection_string

# Secret used to sign JWTs — use a long, random string
JWT_SECRET=your_long_random_secret

# SendGrid (used for invitation/notification emails)
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=your_verified_sender_email@example.com

# Frontend URL (used to build invite links)
CLIENT_URL=http://localhost:5173
```

> **Never commit your `.env` file.** Make sure it's listed in `.gitignore`. When deploying, set these same variables in your hosting provider's environment variable settings (e.g., Render, Vercel) — they are not read from the repo.

### Running Locally

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend:

```bash
cd client
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:5000` by default.

## Email Setup

This project uses **SendGrid** for sending invitation and notification emails over HTTPS.

> **Note:** Gmail SMTP works locally but will not work on hosting providers like Render (free/starter plans block outbound SMTP ports 25/465/587). SendGrid's API uses HTTPS (port 443), which avoids this issue entirely.

To configure:

1. Create a free SendGrid account.
2. Under **Settings → Sender Authentication → Single Sender Verification**, verify the email address you'll send from.
3. Under **Settings → API Keys**, create an API key with "Mail Send" access.
4. Add `SENDGRID_API_KEY` and `EMAIL_FROM` to your environment variables.

## API Overview

All endpoints are prefixed with `/api`. Routes marked 🔒 require a `Bearer <token>` Authorization header.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Log in and receive a JWT |

### Workspaces 🔒
| Method | Endpoint | Description |
|---|---|---|
| GET | `/workspaces` | Get all workspaces for the current user |
| POST | `/workspaces` | Create a new workspace |
| POST | `/workspaces/:workspaceId/members` | Invite a member to a workspace |
| DELETE | `/workspaces/:id` | Delete a workspace (owner only) |

### Projects 🔒
| Method | Endpoint | Description |
|---|---|---|
| POST | `/projects` | Create a new project |
| GET | `/projects/workspace/:workspaceId` | Get all projects in a workspace |
| GET | `/projects/:id` | Get a project by ID (with members) |
| PUT | `/projects/:id` | Update a project |
| DELETE | `/projects/:id` | Delete a project |
| POST | `/projects/:id/members` | Invite a member to a project |
| GET | `/projects/invite/:token` | Get invitation details (public) |
| POST | `/projects/invite/:token/accept` | Accept a project invitation |

### Tasks 🔒
| Method | Endpoint | Description |
|---|---|---|
| POST | `/tasks` | Create a new task |
| GET | `/tasks/project/:projectId` | Get all tasks for a project |
| GET | `/tasks/stats/:projectId` | Get task statistics for a project |
| GET | `/tasks/:id` | Get a task by ID |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |
| GET | `/tasks/:taskId/comments` | Get comments for a task |
| POST | `/tasks/:taskId/comments` | Add a comment to a task |

### Activities 🔒
| Method | Endpoint | Description |
|---|---|---|
| GET | `/activities/workspace/:workspaceId` | Get recent activity for a workspace |

## Deployment

| Layer | Suggested Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Email | SendGrid |

Remember to set all environment variables in both Render (backend) and Vercel (frontend, if applicable) dashboards, and update `CLIENT_URL` in the backend `.env` to your deployed frontend URL once live.

## License

This project is licensed under the MIT License.
