# TeamFlow — Team Task Manager

A full-stack team task management app with role-based access control.

## Tech Stack

**Backend:** Node.js, Express, PostgreSQL, JWT, bcryptjs, express-validator  
**Frontend:** React 18, React Router v6, Axios, CSS (dark theme)

---

## Quick Start

### 1. PostgreSQL Setup

Create the database and run the schema:

```bash
psql -U postgres
CREATE DATABASE task_manager;
\q

psql -U postgres -d task_manager -f backend/db/schema.sql
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials
npm install
npm run dev
```

Backend runs on **http://localhost:5000**

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env if your API URL differs
npm install
npm start
```

Frontend runs on **http://localhost:3000**

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `PORT` | Server port (default 5000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | Allowed CORS origin |

### Frontend (`frontend/.env`)
| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Backend API URL |

---

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | ❌ | Register user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |

### Projects
| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/projects` | Any | List all projects |
| POST | `/api/projects` | Admin | Create project |
| GET | `/api/projects/:id` | Any | Project + tasks |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |

### Tasks
| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/tasks` | Any | List tasks (filterable) |
| POST | `/api/tasks` | Any | Create task |
| GET | `/api/tasks/:id` | Any | Task detail |
| PUT | `/api/tasks/:id` | Any | Update task |
| DELETE | `/api/tasks/:id` | Admin | Delete task |

### Dashboard
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard` | ✅ | Stats + overdue + recent tasks |
| GET | `/api/dashboard/users` | ✅ | List all users |

---

## Roles

| Feature | Member | Admin |
|---|---|---|
| View projects/tasks | ✅ | ✅ |
| Create tasks | ✅ | ✅ |
| Update task status | ✅ | ✅ |
| Create projects | ❌ | ✅ |
| Delete projects | ❌ | ✅ |
| Delete tasks | ❌ | ✅ |

---

## Folder Structure

```
task-manager/
├── backend/
│   ├── server.js           # Express entry point
│   ├── package.json
│   ├── .env.example
│   ├── db/
│   │   ├── db.js           # pg Pool connection
│   │   └── schema.sql      # DB schema
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── dashboard.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectsController.js
│   │   ├── tasksController.js
│   │   └── dashboardController.js
│   └── middleware/
│       ├── auth.js         # JWT verify
│       └── roles.js        # RBAC
└── frontend/
    ├── package.json
    ├── .env.example
    ├── public/index.html
    └── src/
        ├── index.js
        ├── App.js           # Routes + providers
        ├── api.js           # Axios client
        ├── index.css        # Design system
        ├── context/
        │   └── AuthContext.js
        └── pages/
            ├── Layout.js    # Sidebar shell
            ├── Login.js
            ├── Signup.js
            ├── Dashboard.js
            ├── Projects.js
            ├── ProjectDetail.js
            └── TaskDetail.js
```
