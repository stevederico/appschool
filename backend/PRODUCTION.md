# Production Deployment

Platform-neutral deployment steps (Docker image, database volume, Stripe webhook, scaling) live in [docs/DEPLOY.md](../docs/DEPLOY.md). This file is a quick reference for the backend.

## Environment Variables

```bash
# Required
NODE_ENV=production
JWT_SECRET=your-secure-secret
# SQLite (libsqlite3 via the Rust backend): connectionString set in backend/config.json
# default ./databases/AppSchool.db

# Stripe
STRIPE_KEY=sk_test_xxx
STRIPE_ENDPOINT_SECRET=whsec_xxx

# CORS and redirects
CORS_ORIGINS=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

## Database

AppSchool uses SQLite (libsqlite3, zero-crate Rust) at `./databases/AppSchool.db` with these tables:
- `Users` and `Auths` - User accounts, credentials, and subscriptions
- `Courses` - Course metadata
- `Guides` - Markdown content for guides
- `Quizzes` - Quiz questions and answers
- `Reps` - Coding exercises
- `Enrollments` - Courses a user has joined
- `UserProgress` - Per-user progress tracking
- `Bookmarks` - Saved guide sections
- `WebhookEvents` - Processed Stripe events, for idempotency

### Indexes

```sql
CREATE UNIQUE INDEX idx_courses_slug ON Courses(slug);
CREATE UNIQUE INDEX idx_guides_course_slug ON Guides(courseId, slug);
CREATE UNIQUE INDEX idx_quizzes_course_slug ON Quizzes(courseId, slug);
CREATE UNIQUE INDEX idx_reps_course_slug ON Reps(courseId, slug);
CREATE UNIQUE INDEX idx_userprogress_user_course ON UserProgress(userId, courseId);
```

## Health Check

```
GET /api/health
```

Returns a JSON status with a database probe.
