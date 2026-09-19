# PostgreSQL - Interview Ready Guide

**1. Fundamentals** - What It Is, PostgreSQL vs SQLite vs MySQL

**2. Core SQL** - CRUD Operations, Data Types

**3. Relationships** - Joins, Foreign Keys

**4. Aggregations** - GROUP BY, HAVING, Window Functions

**5. Advanced Queries** - Subqueries, CTEs, Recursive Queries

**6. JSONB** - JSON Operations, Indexing JSON

**7. Indexes** - B-Tree, GIN, GiST, When to Use

**8. Transactions** - ACID, Isolation Levels

**9. Full-Text Search** - tsvector, tsquery, Ranking

**10. Node.js Usage** - pg Client, Connection Pooling

**11. Interview Prep** - Common Questions, Practice Project

---

## What It Is

PostgreSQL (Postgres) is a powerful, open-source relational database management system known for its reliability, feature richness, and standards compliance. It's often considered the most advanced open-source database, supporting both SQL (relational) and JSON (non-relational) querying.

Unlike simpler databases like SQLite (single-file, embedded) or MySQL (historically focused on speed over features), PostgreSQL prioritizes data integrity, extensibility, and SQL compliance. It's the database of choice for complex applications that need:

- ACID compliance with strong guarantees
- Complex queries and joins
- Full-text search
- JSON/JSONB support
- Geographic data (PostGIS)
- Custom types and functions
- Concurrent access at scale

Companies like Apple, Instagram, Spotify, and Reddit rely on PostgreSQL for their core data needs.

---

## PostgreSQL vs SQLite vs MySQL

| Feature | PostgreSQL | SQLite | MySQL |
|---------|-----------|--------|-------|
| Architecture | Client-server | Embedded file | Client-server |
| Concurrency | MVCC, excellent | Limited (file locks) | Good |
| ACID compliance | Full | Full | Depends on engine |
| JSON support | Excellent (JSONB) | Basic (text) | Good (JSON type) |
| Full-text search | Built-in | Extension | Built-in |
| Replication | Built-in streaming | None | Built-in |
| Extensions | Extensive | Limited | Limited |
| Best for | Complex apps, analytics | Mobile, small apps | Web apps, read-heavy |

---

## Core SQL Operations

### Database and Table Operations

```sql
-- Create database
CREATE DATABASE myapp;

-- Connect to database (psql command)
\c myapp

-- Create table with constraints
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INTEGER CHECK (age >= 0),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create related table with foreign key
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_users_email ON users(email);

-- Alter table
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users ALTER COLUMN name TYPE VARCHAR(200);
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'member';

-- Drop table
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users CASCADE;
```

### Data Types

```sql
-- Numeric types
SMALLINT                    -- 2 bytes, -32768 to 32767
INTEGER / INT               -- 4 bytes, ~2 billion range
BIGINT                      -- 8 bytes, very large numbers
SERIAL                      -- Auto-incrementing integer
BIGSERIAL                   -- Auto-incrementing bigint
DECIMAL(10,2) / NUMERIC     -- Exact precision
REAL                        -- 4-byte floating point
DOUBLE PRECISION            -- 8-byte floating point

-- Character types
CHAR(n)                     -- Fixed length
VARCHAR(n)                  -- Variable length with limit
TEXT                        -- Unlimited length

-- Date/Time types
DATE                        -- Date only
TIME                        -- Time only
TIMESTAMP                   -- Date and time
TIMESTAMPTZ                 -- Timestamp with timezone (recommended)
INTERVAL                    -- Time intervals

-- Boolean
BOOLEAN                     -- true/false

-- UUID
UUID                        -- Universally unique identifier

-- JSON types
JSON                        -- Stored as text, validated
JSONB                       -- Binary format, indexable (preferred)

-- Arrays
INTEGER[]                   -- Array of integers
TEXT[]                      -- Array of text

-- Other
BYTEA                       -- Binary data
INET                        -- IP addresses
CIDR                        -- Network addresses
```

### CRUD Operations

```sql
-- INSERT
INSERT INTO users (email, name, age, role)
VALUES ('steve@test.com', 'Steve', 30, 'admin');

-- Insert multiple rows
INSERT INTO users (email, name, age) VALUES
    ('alice@test.com', 'Alice', 25),
    ('bob@test.com', 'Bob', 35);

-- Insert with returning
INSERT INTO users (email, name, age)
VALUES ('charlie@test.com', 'Charlie', 28)
RETURNING id, email, created_at;

-- SELECT
SELECT * FROM users;
SELECT id, name, email FROM users;
SELECT name, age FROM users WHERE age > 25;
SELECT * FROM users WHERE role IN ('admin', 'moderator');
SELECT * FROM users WHERE email LIKE '%@test.com';
SELECT * FROM users WHERE name ILIKE '%steve%';  -- Case insensitive
SELECT * FROM users WHERE age BETWEEN 25 AND 35;
SELECT * FROM users WHERE metadata IS NOT NULL;

-- UPDATE
UPDATE users SET age = 31 WHERE email = 'steve@test.com';

UPDATE users 
SET age = 31, updated_at = CURRENT_TIMESTAMP 
WHERE email = 'steve@test.com'
RETURNING *;

-- Conditional update
UPDATE users 
SET role = CASE 
    WHEN age >= 30 THEN 'senior'
    ELSE 'junior'
END;

-- DELETE
DELETE FROM users WHERE id = 1;
DELETE FROM users WHERE created_at < '2024-01-01';

-- UPSERT (INSERT ... ON CONFLICT)
INSERT INTO users (email, name, age)
VALUES ('steve@test.com', 'Steve Updated', 31)
ON CONFLICT (email) 
DO UPDATE SET name = EXCLUDED.name, age = EXCLUDED.age;

-- Upsert - do nothing on conflict
INSERT INTO users (email, name, age)
VALUES ('steve@test.com', 'Steve', 30)
ON CONFLICT (email) DO NOTHING;
```

### Ordering and Pagination

```sql
-- Ordering
SELECT * FROM users ORDER BY created_at DESC;
SELECT * FROM users ORDER BY age ASC, name DESC;
SELECT * FROM users ORDER BY age NULLS LAST;

-- Pagination with LIMIT/OFFSET
SELECT * FROM users ORDER BY id LIMIT 10;
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 20;

-- Cursor-based pagination (more efficient for large datasets)
SELECT * FROM users 
WHERE id > 100 
ORDER BY id 
LIMIT 10;
```

---

## Joins and Relationships

```sql
-- INNER JOIN (only matching rows)
SELECT users.name, posts.title
FROM users
INNER JOIN posts ON users.id = posts.user_id;

-- LEFT JOIN (all left rows, matching right rows)
SELECT users.name, COUNT(posts.id) as post_count
FROM users
LEFT JOIN posts ON users.id = posts.user_id
GROUP BY users.id, users.name;

-- RIGHT JOIN (all right rows, matching left rows)
SELECT users.name, posts.title
FROM users
RIGHT JOIN posts ON users.id = posts.user_id;

-- FULL OUTER JOIN (all rows from both tables)
SELECT users.name, posts.title
FROM users
FULL OUTER JOIN posts ON users.id = posts.user_id;

-- Multiple joins
SELECT 
    users.name,
    posts.title,
    comments.content
FROM users
JOIN posts ON users.id = posts.user_id
JOIN comments ON posts.id = comments.post_id;

-- Self join
SELECT 
    e.name as employee,
    m.name as manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

---

## Aggregations and Grouping

```sql
-- Basic aggregations
SELECT 
    COUNT(*) as total_users,
    AVG(age) as average_age,
    MIN(age) as youngest,
    MAX(age) as oldest,
    SUM(age) as total_age
FROM users;

-- Group by
SELECT role, COUNT(*) as count
FROM users
GROUP BY role;

-- Group by with having (filter after grouping)
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
HAVING COUNT(*) > 5;

-- Multiple groupings
SELECT role, is_active, COUNT(*) as count
FROM users
GROUP BY role, is_active
ORDER BY role, is_active;

-- Aggregate with joins
SELECT 
    users.name,
    COUNT(posts.id) as post_count,
    MAX(posts.created_at) as latest_post
FROM users
LEFT JOIN posts ON users.id = posts.user_id
GROUP BY users.id, users.name
ORDER BY post_count DESC;
```

---

## Subqueries and CTEs

### Subqueries

```sql
-- Subquery in WHERE
SELECT * FROM users
WHERE id IN (
    SELECT user_id FROM posts WHERE published = true
);

-- Subquery in SELECT
SELECT 
    name,
    (SELECT COUNT(*) FROM posts WHERE posts.user_id = users.id) as post_count
FROM users;

-- Subquery in FROM
SELECT avg_posts.role, AVG(avg_posts.post_count) as avg_posts_per_user
FROM (
    SELECT users.role, COUNT(posts.id) as post_count
    FROM users
    LEFT JOIN posts ON users.id = posts.user_id
    GROUP BY users.id, users.role
) as avg_posts
GROUP BY avg_posts.role;

-- EXISTS
SELECT * FROM users
WHERE EXISTS (
    SELECT 1 FROM posts WHERE posts.user_id = users.id
);
```

### Common Table Expressions (CTEs)

```sql
-- Basic CTE
WITH active_users AS (
    SELECT * FROM users WHERE is_active = true
)
SELECT * FROM active_users WHERE age > 25;

-- Multiple CTEs
WITH 
    active_users AS (
        SELECT * FROM users WHERE is_active = true
    ),
    user_posts AS (
        SELECT user_id, COUNT(*) as post_count
        FROM posts
        GROUP BY user_id
    )
SELECT 
    au.name, 
    COALESCE(up.post_count, 0) as posts
FROM active_users au
LEFT JOIN user_posts up ON au.id = up.user_id;

-- Recursive CTE (hierarchical data)
WITH RECURSIVE category_tree AS (
    -- Base case: top-level categories
    SELECT id, name, parent_id, 1 as level
    FROM categories
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: children
    SELECT c.id, c.name, c.parent_id, ct.level + 1
    FROM categories c
    JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY level, name;
```

---

## JSONB Operations

PostgreSQL's JSONB type enables document-style storage with full indexing and querying capabilities.

```sql
-- Create table with JSONB
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    attributes JSONB
);

-- Insert JSONB data
INSERT INTO products (name, attributes) VALUES
    ('Laptop', '{"brand": "Apple", "specs": {"ram": 16, "storage": 512}, "tags": ["electronics", "portable"]}'),
    ('Phone', '{"brand": "Samsung", "specs": {"ram": 8, "storage": 256}, "tags": ["electronics", "mobile"]}');

-- Query JSONB fields
SELECT name, attributes->>'brand' as brand
FROM products;

SELECT name, attributes->'specs'->>'ram' as ram
FROM products;

-- Filter by JSONB value
SELECT * FROM products
WHERE attributes->>'brand' = 'Apple';

-- Filter by nested value
SELECT * FROM products
WHERE (attributes->'specs'->>'ram')::int >= 16;

-- Contains operator (@>)
SELECT * FROM products
WHERE attributes @> '{"brand": "Apple"}';

-- Array contains
SELECT * FROM products
WHERE attributes->'tags' ? 'electronics';

-- Update JSONB
UPDATE products
SET attributes = jsonb_set(attributes, '{specs,ram}', '32')
WHERE name = 'Laptop';

-- Add field
UPDATE products
SET attributes = attributes || '{"color": "silver"}'
WHERE name = 'Laptop';

-- Remove field
UPDATE products
SET attributes = attributes - 'color'
WHERE name = 'Laptop';

-- Index JSONB for performance
CREATE INDEX idx_products_brand ON products ((attributes->>'brand'));
CREATE INDEX idx_products_attributes ON products USING gin (attributes);
```

---

## Indexes

### Index Types

```sql
-- B-tree (default, most common)
CREATE INDEX idx_users_email ON users(email);

-- Unique index
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Composite index
CREATE INDEX idx_users_name_email ON users(name, email);

-- Partial index (filtered)
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;

-- GIN index (for JSONB, arrays, full-text)
CREATE INDEX idx_products_attrs ON products USING gin(attributes);
CREATE INDEX idx_users_tags ON users USING gin(tags);

-- GiST index (for geometric, full-text)
CREATE INDEX idx_locations ON places USING gist(location);

-- Expression index
CREATE INDEX idx_users_lower_email ON users(LOWER(email));
```

### Analyze Query Performance

```sql
-- Explain query plan
EXPLAIN SELECT * FROM users WHERE email = 'steve@test.com';

-- Explain with execution stats
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'steve@test.com';

-- Look for:
-- - Seq Scan (bad for large tables - missing index)
-- - Index Scan (good)
-- - Bitmap Index Scan (good for multiple conditions)
```

---

## Transactions

```sql
-- Basic transaction
BEGIN;
    UPDATE accounts SET balance = balance - 100 WHERE id = 1;
    UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- Rollback on error
BEGIN;
    UPDATE accounts SET balance = balance - 100 WHERE id = 1;
    -- Something went wrong
ROLLBACK;

-- Savepoints
BEGIN;
    UPDATE accounts SET balance = balance - 100 WHERE id = 1;
    SAVEPOINT after_debit;
    
    UPDATE accounts SET balance = balance + 100 WHERE id = 2;
    -- Oops, wrong account
    ROLLBACK TO after_debit;
    
    UPDATE accounts SET balance = balance + 100 WHERE id = 3;
COMMIT;
```

### Isolation Levels

```sql
-- Set isolation level
BEGIN ISOLATION LEVEL SERIALIZABLE;
-- or READ COMMITTED (default), REPEATABLE READ

-- Read Committed: see committed changes from other transactions
-- Repeatable Read: snapshot at start of transaction
-- Serializable: full isolation, transactions appear sequential
```

---

## Full-Text Search

```sql
-- Create text search column
ALTER TABLE posts ADD COLUMN search_vector tsvector;

-- Populate search vector
UPDATE posts SET search_vector = 
    to_tsvector('english', title || ' ' || COALESCE(content, ''));

-- Create GIN index
CREATE INDEX idx_posts_search ON posts USING gin(search_vector);

-- Search
SELECT title, content
FROM posts
WHERE search_vector @@ to_tsquery('english', 'postgres & tutorial');

-- With ranking
SELECT title, ts_rank(search_vector, query) as rank
FROM posts, to_tsquery('english', 'postgres | database') query
WHERE search_vector @@ query
ORDER BY rank DESC;

-- Auto-update with trigger
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', NEW.title || ' ' || COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_search_update
    BEFORE INSERT OR UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();
```

---

## Node.js Usage

### Using pg (node-postgres)

```javascript
import pg from 'pg';
const { Pool } = pg;

// Connection pool
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'secret',
  max: 20,  // Max pool size
  idleTimeoutMillis: 30000
});

// Query
const result = await pool.query('SELECT * FROM users WHERE id = $1', [1]);
console.log(result.rows[0]);

// Insert with returning
const { rows } = await pool.query(
  'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
  ['Steve', 'steve@test.com']
);

// Transaction
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [100, 1]);
  await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [100, 2]);
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

### Using Prisma ORM

```javascript
// schema.prisma
// datasource db {
//   provider = "postgresql"
//   url      = env("DATABASE_URL")
// }

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Create
const user = await prisma.user.create({
  data: { name: 'Steve', email: 'steve@test.com' }
});

// Read
const users = await prisma.user.findMany({
  where: { age: { gte: 18 } },
  include: { posts: true }
});

// Update
const updated = await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Steve Updated' }
});

// Delete
await prisma.user.delete({ where: { id: 1 } });

// Transaction
const [user, post] = await prisma.$transaction([
  prisma.user.create({ data: { name: 'Steve', email: 'steve@test.com' } }),
  prisma.post.create({ data: { title: 'Hello', userId: 1 } })
]);
```

---

## Interview Questions

**Q: What is PostgreSQL and when would you choose it over other databases?**

A: PostgreSQL is an advanced open-source relational database known for reliability, feature richness, and SQL compliance. Choose it when you need: complex queries and joins, ACID compliance, JSONB document storage with indexing, full-text search, custom types/functions, or geographic data (PostGIS). It's ideal for complex applications. Choose SQLite for simple embedded apps, MySQL for read-heavy simpler workloads.

**Q: Explain the difference between JSONB and JSON types.**

A: JSON stores data as text and parses on every access. JSONB stores binary representation, parsed once on insert. JSONB is faster for queries, supports indexing (GIN indexes), and allows operators like containment (@>). Use JSONB unless you need exact text preservation or minimal storage for rarely-queried data.

**Q: What are indexes and when should you create them?**

A: Indexes are data structures that speed up queries by allowing direct lookup instead of full table scans. Create indexes for: frequently queried columns (WHERE clauses), JOIN columns, columns used in ORDER BY. Don't over-index: each index slows writes and consumes storage. Use EXPLAIN ANALYZE to verify index usage.

**Q: Explain PostgreSQL's MVCC.**

A: Multi-Version Concurrency Control allows readers and writers to not block each other. Each transaction sees a snapshot of data. Updates create new row versions rather than overwriting. Old versions are cleaned up by VACUUM. This enables high concurrency without read locks.

**Q: What is the difference between DELETE, TRUNCATE, and DROP?**

A: DELETE removes rows one-by-one, can have WHERE clause, is logged and can be rolled back, triggers fire. TRUNCATE removes all rows instantly by deallocating pages, cannot have WHERE, minimal logging, resets sequences. DROP removes the entire table structure. DELETE for selective removal, TRUNCATE to empty table quickly, DROP to remove table entirely.

**Q: How do you optimize a slow query?**

A: (1) Use EXPLAIN ANALYZE to see execution plan. (2) Look for Seq Scans on large tables—add appropriate indexes. (3) Check for missing indexes on JOIN columns. (4) Ensure statistics are updated (ANALYZE). (5) Consider query rewriting—CTEs, proper JOINs, avoiding subqueries where possible. (6) Check for N+1 problems in application code.

---

## Practice Project

Build a blog platform database:

**Requirements:**
1. Users, Posts, Comments, Tags (many-to-many)
2. JSONB for user preferences and post metadata
3. Full-text search on posts
4. Proper indexes for common queries
5. Soft deletes with triggers
6. View for post statistics
7. Stored procedure for common operations

---

## Resources

- https://www.postgresql.org/docs/ (Official documentation)
- https://www.postgresqltutorial.com/ (Tutorial site)
- https://use-the-index-luke.com/ (Index optimization)
- https://www.prisma.io/docs/ (Prisma ORM)
