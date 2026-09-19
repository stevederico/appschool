# AppSchool Web

Interview preparation platform for JavaScript/React and Swift/iOS developers.

**Website:** [www.appschool.com](https://www.appschool.com)

**Version:** 0.28.0

## Tech Stack

- React 19.2, Vite 8, TypeScript, @stevederico/skateboard-ui 5.1
- Zero-crate Rust backend, SQLite (`./databases/AppSchool.db`)
- Monaco code editor for coding exercises
- Tailwind CSS v4
- Node.js >= 24 (frontend)

## Features

- Course management with guides, quizzes, and reps
- Monaco code editor for practice problems
- Progress tracking with checklists
- Markdown rendering with syntax highlighting
- Quiz grading system
- Blog workspace

## Setup

Install dependencies, then start frontend and backend:

    npm run install-all
    npm run start          # Frontend :5173
    cd backend && cargo run   # Backend :8000

## Scripts

- `npm run start` — Frontend (Vite :5173)
- `npm run front` — Same as start
- `cd backend && cargo run` — Backend :8000
- `npm run build` — Production build (typecheck + Vite)
- `npm run test` — Typecheck + build/docs tests
- `npm run blog` - Blog workspace

## Key Routes

| Route | Purpose |
|-------|---------|
| `/app/courses` | Course list |
| `/app/courses/:slug` | Course detail with progress |
| `/app/courses/:slug/guides/:guideSlug` | Markdown guide reader |
| `/app/courses/:slug/quizzes/:quizSlug` | Quiz with grading |
| `/app/courses/:slug/reps/:repSlug` | Code editor exercise |

---

<div align="center">
  Made with <a href="https://github.com/stevederico/skateboard">Skateboard</a> - a React boilerplate with auth and payments
</div>
