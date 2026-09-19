# Production Deployment

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

# CORS
CLIENT_URL=https://yourdomain.com
```

## Database

AppSchool uses SQLite (libsqlite3, zero-crate Rust) at `./databases/AppSchool.db` with these tables:
- `Users` - User accounts and subscriptions
- `Courses` - Course metadata
- `Guides` - Markdown content for guides
- `Quizzes` - Quiz questions and answers
- `Reps` - Coding exercises
- `Progress` - User progress tracking

### Indexes

```sql
CREATE UNIQUE INDEX idx_courses_slug ON Courses(slug);
CREATE UNIQUE INDEX idx_guides_course_slug ON Guides(courseId, slug);
CREATE UNIQUE INDEX idx_quizzes_course_slug ON Quizzes(courseId, slug);
CREATE UNIQUE INDEX idx_reps_course_slug ON Reps(courseId, slug);
CREATE UNIQUE INDEX idx_progress_visitor_course ON Progress(visitorId, courseId);
```

## Deployment Platforms

### Railway
1. Connect GitHub repo
2. Add environment variables
3. Deploy backend service
4. Set `PORT` to Railway's automatic port

### Vercel
1. Deploy frontend from root
2. Deploy backend as separate project
3. Update `CLIENT_URL` for CORS

## Health Check

```
GET /health
```

Returns `{ status: "ok", timestamp: "..." }`
