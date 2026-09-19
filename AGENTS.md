# AppSchool - AI Agent Guide

Interview preparation platform for JS/React and Swift/iOS developers.

## Commands

```bash
npm run start          # Frontend only (Vite on :5173)
npm run front          # Same as start
cd backend && cargo run   # Backend on :8000
```

**Build Commands:**
```bash
npm run build          # Frontend typecheck + Vite production build
npm run prod           # Same as build
npm install-all        # Install frontend + blog dependencies
cd backend && cargo build --release
```

**Testing:**
```bash
npm run test           # Frontend typecheck + script tests (no vitest)
cd backend && cargo test --locked
```

SQLite file is `backend/databases/AppSchool.db` (`./databases/AppSchool.db` relative to `backend/`; `dbType` "sqlite" in `backend/config.json`). It is tracked in git and copied into the Docker image as the seed DB.

## Architecture

### Frontend (React + Vite)
- `src/main.tsx` - Routes using skateboard-ui
- `src/components/` - Course, Guide, Quiz, Rep, Progress views
- `src/components/MarkdownRenderer.tsx` - Syntax-highlighted markdown

### Backend (zero-crate Rust + SQLite)
- `backend/src/routes.rs` - API routes
- `backend/src/db.rs` - Course, Guide, Quiz, Rep, Progress, Enrollment, Bookmark schema
- `backend/seed/seed-new-courses.js` - Seeds courses, guides, quizzes and reps into SQLite (guide bodies come from `backend/new-guides/`)
- Runtime loads course content from SQLite; an empty guide body falls back to `backend/new-guides/`. Rep bodies live in the DB only (`backend/new-reps/` was removed)

### Database (SQLite)
File at `./databases/AppSchool.db`.
Tables: `Courses`, `Guides`, `Quizzes`, `Reps`, `Enrollments`, `UserProgress`, `Bookmarks`, `Users`

### Content maintenance
- The seed script only inserts missing rows. It never updates or deletes existing ones, so editing a guide file or removing a course entry does not change the shipped DB. Update or delete the rows directly, then set `guideCount` / `quizCount` / `repCount` on the `Courses` row.
- Run `VACUUM` after deleting rows. SQLite leaves deleted text in free pages, and the DB is committed and shipped.
- The iOS Interview Prep course ships 16 guides, 10 quizzes and 0 reps.
- Keep personal details out of guides, quizzes, reps, fixtures and the DB (names, real emails, employers, interview transcripts, Xcode `Created by` headers). Use `example.com` addresses in test data.

### Public release
The public repo is a single-commit snapshot exported from the private working repo (`git archive HEAD` into a fresh directory, then `git init`). Run the `oss-release` audit on the export first (secret files, symlinks, secret-shaped strings, raw-byte grep of the DB). Never push the private repo's history to the public one.

## Key Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/app/courses` | CoursesView | List courses |
| `/app/courses/:slug` | CourseDetailView | Course with progress checklist |
| `/app/courses/:slug/guides/:guideSlug` | GuideView | Markdown guide reader |
| `/app/courses/:slug/quizzes/:quizSlug` | QuizView | Quiz with grading |
| `/app/courses/:slug/reps/:repSlug` | RepView | Code editor |

## API Patterns

```javascript
// Get guide
GET /api/courses/:slug/guides/:guideSlug

// Submit quiz (converts array to map for grading)
POST /api/courses/:slug/quizzes/:quizSlug/submit
Body: { answers: [{ questionId, answer }], timeSpentSeconds }

// Progress checklist includes: slug, title, estimatedMinutes/targetMinutes
GET /api/progress/:courseSlug
```

## Data Models

### Guide
```javascript
{ slug, title, category, content, estimatedMinutes, courseId, published }
```

### Quiz
```javascript
{ slug, title, guideId, courseId, passingScore, questions: [{ id, question, options, correctAnswer }] }
```

### Rep
```javascript
{ slug, title, category, prompt, targetMinutes, starterCode, solution, courseId }
```

## Environment

```bash
# backend/.env — see backend/PRODUCTION.md and docs/DEPLOY.md for all variables
JWT_SECRET=your-secret
# SQLite: connectionString set in backend/config.json (./databases/AppSchool.db)
STRIPE_KEY=sk_test_your-key
STRIPE_ENDPOINT_SECRET=whsec_your-secret
XAI_API_KEY=xai-...   # server-only; POST /api/xai/token mints an ephemeral voice token
```

## TypeScript Standards

### TypeScript Style

- TypeScript everywhere — `.ts` / `.tsx` files, `strict` mode always on
- `npm run typecheck` runs `tsc -p tsconfig.json` (`noEmit` is set in tsconfig) for the frontend; it gates `build`, `prod`, and `test`. Backend is `cargo test`.
- `@types` packages are dev-only dependencies (`@types/node`, `@types/react`, `@types/react-dom`)
- Prefer `const` over `let` — use `let` only when reassigning
- Prefer `async`/`await` over `.then()` chains
- Prefer destructuring: `const { id } = user` over `const id = user.id`
- Prefer array methods (`map`, `filter`, `reduce`) over `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) liberally
- Use template literals over string concatenation
- Use object shorthand: `{ foo }` over `{ foo: foo }`
- Use default parameters over manual checks
- Always use ES modules — never use `require()`

### TypeScript Anti-Patterns (prohibited)

All of these silence the compiler instead of proving correctness:

- Never use `any` — use `unknown` and narrow with type guards
- Never use `as` casts to silence errors (especially `as unknown as X`) — prove the type instead
- Never use `!` non-null assertions — handle the null/undefined case
- Never use `@ts-ignore` — if truly unavoidable, use `@ts-expect-error` with a reason comment (it fails when the error goes away)
- Never use `@ts-nocheck` — it disables type checking for the entire file; stronger than `@ts-ignore` and equally prohibited
- Never disable or loosen `strict` in tsconfig
- Never use loose built-in types (`Function`, `object`, `{}`) — write precise signatures and shapes
- Never cast unvalidated data at boundaries — no `JSON.parse(x) as User` without a runtime check

## Migrating 4.x → 5.0 (exact checklist)

This app is on skateboard 5.6.0 (zero-crate Rust backend). Follow `docs/UPGRADE.md` in this repo and the skateboard reference checklist for icons (`lucide-react`), Vite/SWC, the ui pin, and the Rust backend. Do not stamp `skateboardVersion` by hand.
