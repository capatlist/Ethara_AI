# Team Task Manager for Ethara-AI

A full-stack Team Task Manager built with React for frontend and Node.js for backend, featuring role-based access control, project management, Kanban task boards, and a beautiful dark-themed UI.

## Features

- **Authentication** — Secure signup/login with JWT
- **Projects** — Create, edit, delete projects with color coding
- **Team Management** — Add/remove members with role-based permissions (Owner/Admin/Member)
- **Kanban Board** — Drag tasks across columns: To Do → In Progress → In Review → Done
- **Task Management** — Create, edit, assign, set priorities & due dates
- **Dashboard** — Overview with stats, overdue tasks, and recent activity
- **Role-Based Access Control** — Granular permissions per project

**in short added everything that was in the Ethara-AI project description**

##  Tech Stack


 Frontend | React 18 + Vite + React Router 
 Backend | Node.js + Express.js 
 Database | MongoDB + Mongoose 
 Auth | JWT + bcrypt 
 UI | Custom CSS (dark glassmorphism theme) 

##  Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Setup

```bash
# you can Clone the repo easily using this-
git clone https://github.com/your-username/ethara-ai-task-manager.git
cd ethara-ai-task-manager

# Install all dependencies
npm run install-all

# Set up environment variables
cp .env server/.env
# Edit server/.env with your MongoDB URI and JWT secret

# Run development servers
npm run dev
```
# before deployment use the local machine to run this project-
Frontend: http://localhost:3000  
Backend: http://localhost:5000

##  Project Structure

```
ethara-ai-task-manager/
├── client/              # React Frontend
│   ├── src/
│   │   ├── api/         # Axios config
│   │   ├── components/  # Reusable components
│   │   ├── context/     # Auth context
│   │   ├── pages/       # Page components
│   │   └── index.css    # Design system
│   └── vite.config.js
├── server/              # Node.js Backend
│   ├── config/          # Database config
│   ├── middleware/       # Auth middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   └── index.js         # Server entry
└── package.json         # Root scripts
```

##  API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user

### Projects
- `GET /api/projects` — List projects
- `POST /api/projects` — Create project
- `GET /api/projects/:id` — Project detail
- `PUT /api/projects/:id` — Update project
- `DELETE /api/projects/:id` — Delete project
- `POST /api/projects/:id/members` — Add member
- `DELETE /api/projects/:id/members/:userId` — Remove member

### Tasks
- `GET /api/tasks/dashboard` — Dashboard data
- `GET /api/tasks` — List tasks (with filters)
- `POST /api/tasks` — Create task
- `PUT /api/tasks/:id` — Update task
- `DELETE /api/tasks/:id` — Delete task

### Users
- `GET /api/users` — List users
- `GET /api/users/:id` — User profile

##  Role Permissions

| Action | Owner | Admin | Member |
| Edit project | ✅ | ✅ | ❌ |
| Delete project | ✅ | ❌ | ❌ |
| Manage members | ✅ | ✅ | ❌ |
| Create tasks | ✅ | ✅ | ✅ |
| Edit any task | ✅ | ✅ | ❌ |
| Edit assigned task | ✅ | ✅ | ✅ |
| Delete tasks | ✅ | ✅ | ❌ |

##  Deployment (Railway)

1. Push to GitHub
2. Connect repo to Railway
3. Add MongoDB plugin or use Atlas
4. Set environment variables
5. Deploy!

##  License

MIT
# Ethara_AI
