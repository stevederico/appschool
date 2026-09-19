// One-off: copy AppSchool content (Courses/Guides/Quizzes/Reps) from the
// image-baked ./databases/AppSchool.db into the shared libSQL `AppSchool`
// namespace. Idempotent (INSERT OR REPLACE) — safe to re-run. Run inside the
// appschool-web Railway container after deploy:
//   railway ssh sh -c 'node backend/seed/import-content-to-libsql.js'
//
// Content tables only. User tables (Users/Auths/Enrollments/UserProgress/
// Bookmarks/WebhookEvents) are intentionally NOT touched — those are written
// live via the app and must not be clobbered by the seed.

import { DatabaseSync } from 'node:sqlite';
import { createClient } from '@libsql/client/web';
import { createDbFacade } from '../models/db.js';
import { ensureAppSchoolSchema } from '../models/index.js';

const NAMESPACE = 'AppSchool';
const CONTENT_TABLES = ['Courses', 'Guides', 'Quizzes', 'Reps'];

const url = process.env.LIBSQL_URL;
if (!url) throw new Error('LIBSQL_URL is not set');

const client = createClient({
  url,
  fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    headers.set('x-namespace', NAMESPACE);
    return fetch(input, { ...init, headers });
  }
});

const src = new DatabaseSync('./databases/AppSchool.db');
const db = createDbFacade(client);

// Ensure the namespace schema exists (Courses first — child tables FK it).
await ensureAppSchoolSchema(db);

for (const table of CONTENT_TABLES) {
  const rows = src.prepare(`SELECT * FROM ${table}`).all();
  if (!rows.length) {
    console.log(`${table}: 0 rows, skipped`);
    continue;
  }
  for (const row of rows) {
    const cols = Object.keys(row);
    const sql = `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
    await db.run(sql, ...cols.map(c => row[c]));
  }
  console.log(`${table}: imported ${rows.length}`);
}

console.log('[AppSchool] content import complete');
