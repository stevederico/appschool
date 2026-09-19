# SQLite - Interview Ready Guide

**1. Fundamentals** - What It Is, When to Use, When NOT to Use

**2. SQL Essentials** - Core SQL, Joins, Indexes, Transactions

**3. Configuration** - WAL Mode, Pragmas

**4. Node.js Integration** - better-sqlite3, Transactions, Migrations

**5. Patterns** - Pagination, Search, Upsert

**6. Interview Prep** - Common Questions, Practice Project

---

## What It Is

Single-file, serverless, embedded relational database. No separate process - it reads/writes directly to a file on disk. The entire database is one `.db` file.

---

## When to Use

- Mobile apps (iOS, Android)
- Desktop apps (Electron)
- Prototypes and MVPs
- Local caching
- Testing (swap for Postgres in prod)
- Edge computing / embedded systems
- Low-traffic websites (< 100K hits/day)

---

## When NOT to Use

- High write concurrency (multiple writers)
- Client-server apps with many connections
- Large datasets (> 1TB)
- Need replication or clustering

---

## Core SQL

SQLite uses standard SQL with a few SQLite-specific features. The key operations are CRUD: Create (INSERT), Read (SELECT), Update (UPDATE), Delete (DELETE).

**Key SQLite differences from other databases:**
- `INTEGER PRIMARY KEY` automatically becomes the rowid (very fast)
- `AUTOINCREMENT` prevents rowid reuse after deletion (slightly slower)
- Types are flexible—SQLite uses "type affinity" rather than strict types
- `TEXT`, `INTEGER`, `REAL`, `BLOB`, `NULL` are the storage classes

```sql
-- Create table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  plan TEXT DEFAULT 'free',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert
INSERT INTO users (email, name) VALUES ('steve@example.com', 'Steve');

-- Insert multiple
INSERT INTO users (email, name) VALUES 
  ('a@test.com', 'Alice'),
  ('b@test.com', 'Bob');

-- Query
SELECT * FROM users WHERE email = 'steve@example.com';
SELECT name, email FROM users WHERE plan = 'pro' ORDER BY created_at DESC;
SELECT * FROM users WHERE name LIKE 'S%';
SELECT * FROM users LIMIT 10 OFFSET 20;

-- Update
UPDATE users SET name = 'Steve D', plan = 'pro' WHERE id = 1;

-- Delete
DELETE FROM users WHERE id = 1;

-- Count
SELECT COUNT(*) FROM users WHERE plan = 'pro';
SELECT plan, COUNT(*) as count FROM users GROUP BY plan;
```

---

## Joins

Joins combine rows from multiple tables based on a related column. Understanding joins is essential for relational databases.

**Join types:**
- **INNER JOIN** — Only rows that match in both tables (the intersection)
- **LEFT JOIN** — All rows from left table, matched rows from right (nulls if no match)
- **RIGHT JOIN** — Opposite of LEFT (SQLite doesn't support this, use LEFT with reversed tables)
- **CROSS JOIN** — Every combination of rows (cartesian product, rarely used)

**Mental model:** Think of INNER JOIN as "give me only complete matches" and LEFT JOIN as "give me everything from the first table, filling in what you can from the second."

```sql
-- Tables
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  total REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Inner join (only matching rows)
SELECT users.name, orders.total, orders.created_at
FROM orders
JOIN users ON orders.user_id = users.id;

-- Left join (all users, even without orders)
SELECT users.name, COUNT(orders.id) as order_count
FROM users
LEFT JOIN orders ON users.id = orders.user_id
GROUP BY users.id;

-- Multiple joins
SELECT users.name, orders.total, products.name as product
FROM orders
JOIN users ON orders.user_id = users.id
JOIN order_items ON orders.id = order_items.order_id
JOIN products ON order_items.product_id = products.id;
```

---

## Indexes (Critical for Performance)

An index is a separate data structure that speeds up lookups. Without an index, SQLite must scan every row (O(n)). With an index, it can jump directly to matching rows (O(log n)).

**The trade-off:** Indexes speed up reads but slow down writes. Every INSERT/UPDATE/DELETE must also update the index. Choose indexes carefully.

**When to index:**
- Columns in WHERE clauses
- Columns in JOIN conditions
- Columns in ORDER BY (if not already indexed)

**When NOT to index:**
- Tables with few rows
- Columns with low cardinality (like boolean flags)
- Tables with heavy write loads and few reads

```sql
-- Create index for frequently queried columns
CREATE INDEX idx_users_email ON users(email);

-- Composite index (order matters!)
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);

-- Unique index
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Check if index is being used
EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = 'test@test.com';
-- Good: "SEARCH users USING INDEX idx_users_email"
-- Bad: "SCAN users" (full table scan)

-- List indexes
SELECT name FROM sqlite_master WHERE type = 'index';

-- Drop index
DROP INDEX idx_users_email;
```

**Index Rules:**
- Index columns in WHERE clauses
- Index columns in JOIN conditions
- Index columns in ORDER BY
- Don't over-index (slows writes)

---

## Transactions

```sql
-- Basic transaction
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- Rollback on error
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  -- Something went wrong...
ROLLBACK;
```

**ACID Properties:**
- **Atomicity**: All or nothing
- **Consistency**: Valid state to valid state
- **Isolation**: Transactions don't interfere
- **Durability**: Committed = permanent

---

## WAL Mode (Important)

```sql
-- Enable Write-Ahead Logging for better concurrency
PRAGMA journal_mode=WAL;

-- Other useful pragmas
PRAGMA foreign_keys = ON;        -- Enforce foreign keys
PRAGMA busy_timeout = 5000;      -- Wait 5s if locked
PRAGMA cache_size = -64000;      -- 64MB cache
PRAGMA synchronous = NORMAL;     -- Balance speed/safety
```

**WAL Benefits:**
- Readers don't block writers
- Writers don't block readers
- Better performance for read-heavy workloads
- Crash recovery

---

## Node.js Usage (better-sqlite3)

`better-sqlite3` is the recommended SQLite driver for Node.js. Unlike other drivers, it's synchronous—queries block until complete. This sounds bad but is actually faster because there's no async overhead, and SQLite operations are so fast that blocking is fine.

**Key concepts:**
- `prepare()` compiles a SQL statement (do this once, reuse many times)
- `get()` returns first row or undefined
- `all()` returns array of all rows
- `run()` executes and returns `{ changes, lastInsertRowid }`

**Why synchronous is OK:** SQLite queries typically take microseconds. The async overhead of callbacks/promises would be more expensive than the query itself.

```javascript
import Database from 'better-sqlite3';

// Open database (creates if doesn't exist)
const db = new Database('app.db');

// Enable WAL and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Simple query
const user = db.prepare('SELECT * FROM users WHERE id = ?').get(1);
console.log(user); // { id: 1, email: 'steve@test.com', name: 'Steve' }

// All results
const users = db.prepare('SELECT * FROM users WHERE plan = ?').all('pro');

// Insert
const insert = db.prepare('INSERT INTO users (email, name) VALUES (?, ?)');
const result = insert.run('new@test.com', 'New User');
console.log(result.lastInsertRowid); // 4
console.log(result.changes);         // 1

// Named parameters
const stmt = db.prepare('INSERT INTO users (email, name) VALUES (@email, @name)');
stmt.run({ email: 'test@test.com', name: 'Test' });

// Update
const update = db.prepare('UPDATE users SET plan = ? WHERE id = ?');
update.run('pro', 1);

// Delete
const del = db.prepare('DELETE FROM users WHERE id = ?');
del.run(1);
```

---

## Transactions in Node.js

`better-sqlite3` provides a `transaction()` helper that wraps multiple operations in a single transaction. If any operation throws, the entire transaction is rolled back automatically.

**Why transactions matter for bulk operations:** Without a transaction, each INSERT is a separate disk write. With a transaction, all INSERTs are batched into one write—often 100x faster for bulk inserts.

```javascript
// Transaction function
const transferMoney = db.transaction((fromId, toId, amount) => {
  const from = db.prepare('SELECT balance FROM accounts WHERE id = ?').get(fromId);
  
  if (from.balance < amount) {
    throw new Error('Insufficient funds');
  }
  
  db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(amount, fromId);
  db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(amount, toId);
  
  return { success: true };
});

// Usage - automatically commits or rolls back
try {
  transferMoney(1, 2, 100);
} catch (err) {
  console.error('Transfer failed:', err.message);
}

// Bulk insert (much faster with transaction)
const insertMany = db.transaction((users) => {
  const insert = db.prepare('INSERT INTO users (email, name) VALUES (?, ?)');
  for (const user of users) {
    insert.run(user.email, user.name);
  }
});

insertMany([
  { email: 'a@test.com', name: 'Alice' },
  { email: 'b@test.com', name: 'Bob' },
  { email: 'c@test.com', name: 'Charlie' },
]);
```

---

## Migrations

Migrations track database schema changes over time. Each migration is a SQL statement that modifies the schema. A migrations table tracks which have been applied.

**Why migrations matter:** Without them, you'd have to manually run schema changes on every environment (development, staging, production). Migrations ensure the database schema matches your code.

**The pattern:**
1. Store migrations in order (array or numbered files)
2. Track applied migrations in a table
3. On startup, run any migrations not yet applied

```javascript
// Simple migration system
const migrations = [
  // Migration 1
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT
  )`,
  
  // Migration 2
  `ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free'`,
  
  // Migration 3
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
];

// Track migrations
db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Apply pending migrations
const applied = db.prepare('SELECT id FROM migrations').all().map(r => r.id);

migrations.forEach((sql, index) => {
  if (!applied.includes(index)) {
    db.exec(sql);
    db.prepare('INSERT INTO migrations (id) VALUES (?)').run(index);
    console.log(`Applied migration ${index}`);
  }
});
```

---

## Common Patterns

These patterns appear constantly in real applications. Each solves a specific problem efficiently.

### Pagination

Pagination fetches results in chunks rather than all at once. Use LIMIT for page size and OFFSET to skip previous pages. Always ORDER BY a consistent column to ensure stable pagination.
```javascript
function getUsers(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const users = db.prepare(`
    SELECT * FROM users 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(limit, offset);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  
  return {
    users,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
}
```

### Search

LIKE with wildcards (`%`) enables simple text search. For better performance on large tables, consider SQLite's FTS5 (Full-Text Search) extension.

```javascript
function searchUsers(query) {
  return db.prepare(`
    SELECT * FROM users 
    WHERE name LIKE ? OR email LIKE ?
    LIMIT 50
  `).all(`%${query}%`, `%${query}%`);
}
```

### Upsert

Upsert (UPDATE or INSERT) inserts a new row, or updates if a conflict occurs. The `ON CONFLICT` clause specifies which column triggers the conflict and what to do. `excluded` refers to the values that would have been inserted.

```javascript
const upsert = db.prepare(`
  INSERT INTO users (email, name) VALUES (?, ?)
  ON CONFLICT(email) DO UPDATE SET name = excluded.name
`);
upsert.run('steve@test.com', 'Steve Updated');
```

---

## Interview Questions

**Q: SQLite vs PostgreSQL?**
A: SQLite is embedded/serverless, single-file, great for local/mobile. Postgres is client-server, handles high concurrency, has more features (JSONB, full-text search, extensions). Use SQLite for development/embedded, Postgres for production servers.

**Q: How does SQLite handle concurrent writes?**
A: File-level locking. Only one writer at a time, but multiple readers. WAL mode improves this by allowing reads during writes.

**Q: What's WAL mode?**
A: Write-Ahead Logging. Writes go to a separate log file first, allowing concurrent reads. Better performance for read-heavy workloads. Enabled with `PRAGMA journal_mode=WAL`.

**Q: How do you optimize a slow SQLite query?**
A: 1) Add indexes on WHERE/JOIN columns, 2) Use EXPLAIN QUERY PLAN, 3) Avoid SELECT *, 4) Use LIMIT, 5) Enable WAL mode, 6) Increase cache_size.

**Q: What are the ACID properties?**
A: Atomicity (all or nothing), Consistency (valid states), Isolation (transactions don't interfere), Durability (committed data persists).

**Q: When would you NOT use SQLite?**
A: High write concurrency, multiple servers needing same database, datasets larger than RAM, need for replication.

**Q: How do foreign keys work in SQLite?**
A: Must be enabled with `PRAGMA foreign_keys = ON`. Then use `FOREIGN KEY (col) REFERENCES other_table(col)` in CREATE TABLE.

**Q: What's the maximum database size?**
A: 281 TB theoretically, but performance degrades. Practical limit is when DB exceeds available RAM.

---

## Practice Project

Build a CLI todo app:

```
todo add "Buy groceries" --due 2024-01-15 --tag shopping
todo list
todo list --tag shopping
todo done 1
todo delete 1
```

Requirements:
- Todos table with id, title, done, due_date, created_at
- Tags table with many-to-many relationship
- Use transactions for tag operations
- Add indexes for common queries
- Implement pagination for list

---

## Resources

- https://sqlite.org/lang.html (official SQL reference)
- https://sqlite.org/pragma.html (all PRAGMA options)
- https://sqlitebrowser.org (GUI tool for exploring)
- https://github.com/WiseLibs/better-sqlite3 (Node.js driver docs)
