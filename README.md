# 📄 Bureaucracy Buddy – מזכיר ביורוקרטיה 🇮🇱

A modern web assistant to help Israeli citizens manage their daily bureaucratic chaos — from passport renewals to license reminders.  
Built as a PWA with React + FastAPI, and AI-generated tips in Hebrew ✡️.

---

## 🧰 Tech Stack

| Layer     | Tech                        |
|-----------|-----------------------------|
| Frontend  | React (TypeScript, Vite, TailwindCSS) |
| Backend   | Python FastAPI              |
| DB        | PostgreSQL (via Docker)     |
| Tasks     | APScheduler + Redis         |
| AI        | OpenAI GPT-4 Function Calling |
| Auth      | Email Magic Link (optional: Auth0 / Clerk) |
| Push      | Web Push API + Service Worker (iOS/Android) |

---

## ⚙️ Local Setup

> 🧠 Recommended: VS Code + Docker Desktop (macOS)

### 1. Clone this repo

```bash
git clone https://github.com/yourname/bureaucracy-buddy.git
cd bureaucracy-buddy
