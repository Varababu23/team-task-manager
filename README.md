# 📋 Team Task Manager

A full-stack collaborative task management application built with **Node.js + Express**, **React + Vite**, and **SQLite**. Designed for teams to efficiently organize projects, manage tasks, and collaborate in real-time.

---

## ✨ Features

- **User Authentication** – JWT-based signup/login with secure password handling
- **Project Management** – Create and manage multiple projects with team members
- **Task Organization** – Create, update, delete, and track tasks across projects
- **Dashboard** – Real-time overview of project statistics and task metrics
- **Team Collaboration** – Add team members to projects with role-based access
- **Responsive Design** – Works seamlessly on desktop and mobile devices
- **Zero Database Setup** – SQLite database auto-initializes locally

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ ([download here](https://nodejs.org))
- **npm** (comes with Node.js)

### Installation

```bash
# Clone or navigate to the project
cd team-task-manager

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running Locally

**Terminal 1 – Backend:**
```bash
cd backend
npm start
```

Expected output:
```
✅ Database initialized: database.sqlite
🚀 Server running on http://localhost:5000
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser and log in with your account.

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── migrations/            # Database migrations
│   ├── src/
│   │   ├── app.js                 # Express app setup & routes
│   │   ├── db.js                  # Database connection & initialization
│   │   ├── prisma.js              # Prisma client instance
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT authentication middleware
│   │   └── routes/
│   │       ├── auth.js            # Authentication endpoints (signup/login)
│   │       ├── projects.js        # Project management endpoints
│   │       ├── tasks.js           # Task CRUD endpoints
│   │       └── dashboard.js       # Dashboard statistics endpoints
│   ├── package.json
│   ├── prisma.config.ts
│   └── database.sqlite            # SQLite database (auto-created)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Main app router
│   │   ├── main.jsx               # React entry point
│   │   ├── api.js                 # Axios HTTP client with auth
│   │   ├── styles.css             # Global styles
│   │   ├── components/
│   │   │   └── Layout.jsx         # App layout & sidebar
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Authentication state management
│   │   └── pages/
│   │       ├── Login.jsx          # Login page
│   │       ├── Signup.jsx         # User registration page
│   │       ├── Dashboard.jsx      # Dashboard with statistics
│   │       ├── Projects.jsx       # Projects list
│   │       └── ProjectDetail.jsx  # Project detail with tasks
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── railway.toml                   # Railway deployment config
├── package.json                   # Root package config
└── README.md
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Register new user | ❌ |
| POST | `/api/auth/login` | User login (returns JWT) | ❌ |
| GET | `/api/auth/me` | Get current user info | ✅ |

### Projects
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects` | Get all user's projects | ✅ |
| POST | `/api/projects` | Create new project | ✅ |
| GET | `/api/projects/:id` | Get project details | ✅ |
| PUT | `/api/projects/:id` | Update project | ✅ |
| DELETE | `/api/projects/:id` | Delete project | ✅ |
| POST | `/api/projects/:id/members` | Add team member | ✅ |

### Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tasks` | Get all tasks | ✅ |
| POST | `/api/tasks` | Create task | ✅ |
| PUT | `/api/tasks/:id` | Update task | ✅ |
| DELETE | `/api/tasks/:id` | Delete task | ✅ |
| PATCH | `/api/tasks/:id/status` | Update task status | ✅ |

### Dashboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard` | Get dashboard statistics | ✅ |

---

## 🛠️ Technology Stack

### Backend
- **Express.js** – Fast & minimal web framework
- **Node.js** – JavaScript runtime
- **SQLite** – Lightweight embedded database
- **Prisma** – ORM for database management
- **JWT** – Secure authentication tokens
- **CORS** – Cross-origin resource sharing

### Frontend
- **React 18** – UI library with hooks
- **Vite** – Lightning-fast build tool
- **Axios** – HTTP client
- **CSS3** – Styling & responsive design

---

## 🔐 Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database (optional, auto-uses SQLite)
DATABASE_URL=file:./database.sqlite

# JWT Secret (change this in production!)
JWT_SECRET=your_super_secret_key_here

# CORS Origins
CLIENT_URL=http://localhost:5173
```

Frontend uses `http://localhost:5000` by default via `api.js`.

---

## 📊 Database Schema

The app uses Prisma ORM with the following main tables:
- **User** – User accounts with email & password
- **Project** – Projects created by users
- **ProjectMember** – Team members assigned to projects
- **Task** – Tasks within projects with status tracking

See `backend/prisma/schema.prisma` for the complete schema.

---

## 🚢 Deployment

### Railway
This project is configured for [Railway](https://railway.app) deployment:

1. Push to GitHub
2. Connect repository to Railway
3. Set environment variables in Railway dashboard
4. Deploy automatically on push

See `railway.toml` for configuration details.

---

## 📝 Development Notes

- **Hot Reload** – Both frontend (Vite) and backend (with nodemon) support hot reloading during development
- **CORS** – Configured to accept requests from localhost:5173 and CLIENT_URL
- **JWT Auth** – Token stored in frontend localStorage; sent with every API request
- **Database** – SQLite file persists locally; migrations tracked with Prisma

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Open a pull request

---

## 📄 License

This project is open source and available under the MIT License.

---

## 💡 Tips

- Clear browser cache if authentication issues occur
- Check backend logs (`npm start`) for API errors
- Ensure both backend (port 5000) and frontend (port 5173) are running
- SQLite database file (`database.sqlite`) is git-ignored; create with `npm start` in backend

---

**Built with ❤️ for efficient team collaboration**
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
