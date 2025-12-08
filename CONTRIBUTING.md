# Contributing to Smart Attendance System

Welcome to the Smart Attendance System project! This guide will help you set up your development environment and understand our workflow.

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Rohan1o1/Smart_Attendance_System.git
cd Smart_Attendance_System
```

### 2. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Setup
Create `.env` files (ask team lead for values):

**Server (.env in /server folder):**
```
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

**Client (.env in /client folder):**
```
VITE_API_URL=http://localhost:5001/api
```

### 4. Run the Application
```bash
# Terminal 1: Start server
cd server
npm run dev

# Terminal 2: Start client
cd client
npm run dev
```

---

## 🌿 Branch Strategy

### Branch Structure
```
main                    # Production-ready code (protected)
  └── develop           # Integration branch (protected)
        ├── feature/*   # New features
        ├── bugfix/*    # Bug fixes
        └── hotfix/*    # Urgent production fixes
```

### Branch Naming Convention
| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/short-description` | `feature/student-dashboard` |
| Bug Fix | `bugfix/issue-description` | `bugfix/login-validation` |
| Hot Fix | `hotfix/critical-fix` | `hotfix/auth-crash` |

---

## 👥 Team Assignments

| Member | Area | Branch Prefix |
|--------|------|---------------|
| **Member 1** | Auth & User Management (Frontend) | `feature/auth-*` |
| **Member 2** | Student Module (Frontend) | `feature/student-*` |
| **Member 3** | Teacher & Admin Module (Frontend) | `feature/teacher-*`, `feature/admin-*` |
| **Member 4** | Auth & Core APIs (Backend) | `feature/api-auth-*`, `feature/api-class-*` |
| **Member 5** | Face Recognition & Attendance (Backend) | `feature/api-face-*`, `feature/api-attendance-*` |

---

## 📝 Workflow

### Starting New Work
```bash
# 1. Switch to develop branch and pull latest
git checkout develop
git pull origin develop

# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Work on your code...

# 4. Stage and commit changes
git add .
git commit -m "feat: add student dashboard layout"

# 5. Push to GitHub
git push origin feature/your-feature-name

# 6. Create Pull Request on GitHub (develop ← your-branch)
```

### Commit Message Format
```
<type>: <short description>

Types:
- feat:     New feature
- fix:      Bug fix
- docs:     Documentation changes
- style:    Code style (formatting, semicolons, etc)
- refactor: Code refactoring
- test:     Adding tests
- chore:    Build tasks, configs, etc
```

**Examples:**
```bash
git commit -m "feat: add face recognition component"
git commit -m "fix: resolve login validation error"
git commit -m "docs: update API documentation"
git commit -m "style: format attendance controller"
```

---

## 🔀 Pull Request Process

1. **Create PR** from your feature branch to `develop`
2. **Add description** of what you changed
3. **Request review** from at least 1 team member
4. **Address feedback** if any
5. **Merge** after approval

### PR Title Format
```
[Feature/Fix/Docs] Short description
```
Examples:
- `[Feature] Add student attendance marking`
- `[Fix] Resolve teacher dashboard navigation`
- `[Docs] Update README with setup instructions`

---

## ⚠️ Important Rules

### DO ✅
- Pull latest `develop` before creating new branch
- Write clear commit messages
- Test your code before pushing
- Create small, focused PRs
- Review others' code

### DON'T ❌
- Push directly to `main` or `develop`
- Commit `.env` files or secrets
- Commit `node_modules/`
- Force push to shared branches
- Merge your own PR without review

---

## 🔧 Common Git Commands

```bash
# Check current branch
git branch

# See all branches
git branch -a

# Switch branch
git checkout branch-name

# Pull latest changes
git pull origin develop

# See changes
git status
git diff

# Undo uncommitted changes
git checkout -- filename

# Stash changes temporarily
git stash
git stash pop

# View commit history
git log --oneline
```

---

## 🆘 Need Help?

- **Git issues?** Ask the team lead
- **Merge conflicts?** Don't panic! Ask for help
- **Bug found?** Create an issue on GitHub

Happy coding! 🎉
