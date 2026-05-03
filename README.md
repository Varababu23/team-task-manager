# TaskFlow – Team Task Manager

A full-stack collaborative task management web app built with **Node.js + Express**, **React + Vite**, and **SQLite** (no database installation needed locally).

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18 or higher — [download here](https://nodejs.org)

### Step 1 – Install dependencies

```bash
cd team-task-manager

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### Step 2 – Run backend

```bash
cd backend
npm run dev
```

You should see:
```
✅ SQLite database initialized at: .../backend/database.sqlite
🚀 Server running on http://localhost:5000
```

> **No PostgreSQL needed!** SQLite creates a local `database.sqlite` file automatically.

### Step 3 – Run frontend (new terminal)

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Project Structure

```
team-task-manager/
├── backend/
│   ├── src/
│   │   ├── db.js                  # SQLite setup (auto-creates tables)
│   │   ├── app.js                 # Express entry point
│   │   ├── middleware/auth.js     # JWT auth middleware
│   │   └── routes/
│   │       ├── auth.js            # Signup / Login
│   │       ├── projects.js        # Projects + members + tasks
│   │       ├── tasks.js           # Task update / delete
│   │       └── dashboard.js       # Dashboard stats
│   ├── .env                       # Environment config (ready to use)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api.js                 # Axios instance with JWT
│   │   ├── App.jsx                # Routes
│   │   ├── context/AuthContext.jsx
│   │   ├── components/Layout.jsx  # Sidebar
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Signup.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Projects.jsx
│   │       └── ProjectDetail.jsx  # Tasks + Kanban + Members
│   └── package.json
├── railway.toml                   # Deployment config
└── README.md
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register (name, email, password) |
| POST | `/api/auth/login` | Login → returns JWT token |
| GET | `/api/auth/me` | Current user info |

### Projects
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/projects` | All user's projects |
| POST | `/api/projects` | Create project (auto Admin) |
| GET | `/api/projects/:id` | Project + members |
| PUT | `/api/projects/:id` | Update (Admin only) |
| DELETE | `/api/projects/:id` | Delete (Admin only) |
| POST | `/api/projects/:id/members` | Add member by email (Admin) |
| DELETE | `/api/projects/:id/members/:uid` | Remove member (Admin) |
| GET | `/api/projects/:id/tasks` | List tasks (with filters) |
| POST | `/api/projects/:id/tasks` | Create task (Admin only) |

### Tasks
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/tasks/:id` | Task details |
| PUT | `/api/tasks/:id` | Update (Admin: all; Member: status only) |
| DELETE | `/api/tasks/:id` | Delete (Admin only) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Stats: total, by status, overdue, per user |

---

## Role-Based Access Control

| Action | Admin | Member |
|--------|:-----:|:------:|
| Create / delete project | ✅ | ❌ |
| Add / remove members | ✅ | ❌ |
| Create / delete tasks | ✅ | ❌ |
| Edit any task field | ✅ | ❌ |
| Update status of **own** task | ✅ | ✅ |
| View project & tasks | ✅ | ✅ |

---

## Database Schema (SQLite)

```sql
users          (id, name, email, password_hash, created_at)
projects       (id, name, description, created_by→users, created_at)
project_members(id, project_id→projects, user_id→users, role[admin|member], joined_at)
tasks          (id, project_id, title, description, due_date, priority[low|medium|high],
                status[todo|in_progress|done], assigned_to→users, created_by, created_at, updated_at)
```

---

## Deployment on Railway

Railway does not support SQLite persistence (ephemeral filesystem). Use Railway's **PostgreSQL plugin** for production.

### Steps

1. **Push to GitHub**
```bash
git init && git add . && git commit -m "init"
git remote add origin https://github.com/YOUR_USERNAME/team-task-manager.git
git push -u origin main
```

2. **Create Railway project** → "Deploy from GitHub repo"

3. **Add PostgreSQL** → In your Railway project click `+ New` → `Database` → `PostgreSQL`

4. **Update `backend/src/db.js`** for production — swap to `pg` package using `DATABASE_URL` env var, or use the dual-db approach below.

5. **Set environment variables** in Railway:
```
JWT_SECRET=your_long_random_secret
NODE_ENV=production
```

> Railway auto-injects `DATABASE_URL` from the PostgreSQL plugin.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `JWT_SECRET` | `dev_secret_...` | JWT signing key (change in production!) |
| `NODE_ENV` | `development` | Environment |
| `CLIENT_URL` | `*` | CORS origin |
| `DB_PATH` | `./database.sqlite` | SQLite file path (local only) |
