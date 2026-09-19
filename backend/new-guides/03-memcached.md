# Memcached - Interview Ready Guide

**1. Fundamentals** - What It Is, Architecture, When to Use, When NOT to Use

**2. Operations** - Storage Commands, Retrieval, Delete, Arithmetic, CAS

**3. Internals** - Expiration Behavior, Slab Allocation

**4. Node.js Integration** - memjs Client, Basic Operations, CAS, Multi-Get

**5. Patterns** - Cache-Aside, Write-Through, Stampede Prevention, Sessions, Fragments

**6. Scaling** - Consistent Hashing, Virtual Nodes, Monitoring

**7. Interview Prep** - Common Questions, Memcached vs Redis, Practice Project

---

## What It Is

Memcached is a high-performance, distributed memory caching system designed to speed up dynamic web applications by reducing database load. Created by Brad Fitzpatrick in 2003 for LiveJournal, it has become one of the foundational technologies of web-scale architecture, used by Facebook, Twitter, YouTube, and countless other high-traffic services.

At its core, Memcached is elegantly simple: it's a giant hash table spread across multiple servers. You give it a key and a value, and it stores that value in RAM. You ask for a key, and it returns the value. That's essentially it. This simplicity is intentional—Memcached does one thing and does it extremely well.

Unlike Redis, which evolved into a feature-rich data structure server, Memcached has remained focused on its original mission: being the fastest possible key-value cache. It doesn't support complex data types, persistence, replication, or pub/sub. What it does offer is raw speed, simplicity, and battle-tested reliability at massive scale.

---

## Architecture and Design Philosophy

### Why Memcached Is Fast

Memcached achieves its performance through several architectural decisions:

**Multi-threaded Design**: Unlike Redis's single-threaded model, Memcached uses multiple threads to handle connections. On modern multi-core servers, this allows Memcached to utilize all available CPU cores for processing requests. A single Memcached instance can handle hundreds of thousands of operations per second.

**Simple Protocol**: The Memcached protocol is minimalist. Commands are short, parsing is fast, and there's minimal overhead. This simplicity translates directly to speed.

**Slab Allocation**: Rather than using malloc/free for each item (which causes memory fragmentation), Memcached pre-allocates memory into slabs of fixed-size chunks. When you store an item, it goes into the smallest chunk that fits. This eliminates fragmentation and makes memory management predictable.

**LRU Eviction**: When memory is full, Memcached evicts the least recently used items. This happens automatically—you never get an "out of memory" error; old data simply disappears to make room for new data.

### The Distributed Part

Memcached itself knows nothing about distribution. Each Memcached server operates independently. The "distributed" aspect comes from the client library, which uses consistent hashing to determine which server holds each key.

```
Client Request: GET user:123
    ↓
Client Library: hash("user:123") → Server 2
    ↓
Server 2: Returns value
```

This architecture has important implications:

1. **No server-to-server communication**: Servers don't know about each other. Adding or removing servers is simple—just update the client configuration.

2. **No replication**: If a server dies, its data is gone. The application must handle cache misses gracefully.

3. **Linear scalability**: Need more cache capacity? Add more servers. Each server handles its own subset of keys independently.

---

## When to Use Memcached

### Simple Caching at Scale
When you need to cache strings or serialized objects and don't need Redis's data structures, Memcached's simplicity is an advantage. Less complexity means fewer things that can go wrong.

### Multi-threaded Workloads
If your cache server has many CPU cores and you're doing simple get/set operations, Memcached can outperform Redis by utilizing all cores.

### When You Have Existing Infrastructure
Many organizations have years of Memcached deployment experience. If Memcached is already working well in your stack, there may be no compelling reason to migrate to Redis.

### Ephemeral Data Only
Memcached is perfect for data that's okay to lose: rendered HTML fragments, serialized API responses, session data (if you handle the edge cases), computed results.

---

## When NOT to Use Memcached

### Complex Data Manipulation
Need to increment a counter, append to a list, or compute set intersections? These require multiple round trips in Memcached but are single operations in Redis.

### Data Persistence
Memcached has no persistence. Server restart = data loss. If you need cached data to survive restarts, use Redis with AOF/RDB.

### Pub/Sub or Messaging
Memcached has no publish/subscribe capability. Use Redis or a dedicated message broker.

### Complex Cache Invalidation
Without data structures like sets, implementing patterns like "invalidate all keys matching X" is difficult. Redis's key scanning and data structures make this easier.

### Small Deployments
For a single server or small-scale use, Redis is more versatile with negligible performance difference.

---

## Core Operations

Memcached operations are intentionally simple. Here are the essential commands:

### Storage Commands

```bash
# SET - Store a key-value pair
# set <key> <flags> <exptime> <bytes>
set user:123 0 3600 15
{"name":"Steve"}
# STORED

# Breakdown:
# - key: "user:123"
# - flags: 0 (arbitrary 32-bit integer, often used by clients for serialization hints)
# - exptime: 3600 (seconds until expiration, 0 = never)
# - bytes: 15 (length of the value)
# - value: {"name":"Steve"}

# ADD - Store only if key doesn't exist
add user:123 0 3600 15
{"name":"Steve"}
# STORED (if new) or NOT_STORED (if exists)

# REPLACE - Store only if key exists
replace user:123 0 3600 17
{"name":"Steve D"}
# STORED (if exists) or NOT_STORED (if doesn't exist)

# APPEND - Add data to end of existing value
append user:123 0 0 6
,admin
# STORED

# PREPEND - Add data to beginning of existing value
prepend user:123 0 0 5
ROLE:
# STORED
```

### Retrieval Commands

```bash
# GET - Retrieve one or more keys
get user:123
# VALUE user:123 0 15
# {"name":"Steve"}
# END

# Multiple keys in one request
get user:123 user:456 user:789
# VALUE user:123 0 15
# {"name":"Steve"}
# VALUE user:456 0 13
# {"name":"Bob"}
# END
# (user:789 not returned if it doesn't exist)

# GETS - Get with CAS (Check And Set) token
gets user:123
# VALUE user:123 0 15 12345
# {"name":"Steve"}
# END
# The 12345 is the CAS token for optimistic locking
```

### Delete Command

```bash
# DELETE - Remove a key
delete user:123
# DELETED (if existed) or NOT_FOUND (if didn't exist)
```

### Arithmetic Commands

```bash
# INCR - Increment a numeric value
set pageviews:home 0 0 1
0
# STORED

incr pageviews:home 1
# 1

incr pageviews:home 10
# 11

# DECR - Decrement a numeric value
decr pageviews:home 5
# 6

# Note: Values must be unsigned 64-bit integers
# Cannot go below 0 (decrementing 0 stays at 0)
# Cannot increment non-numeric values
```

### CAS (Check And Set) - Optimistic Locking

CAS prevents race conditions when multiple clients might update the same key:

```bash
# 1. Get value with CAS token
gets user:123
# VALUE user:123 0 15 12345
# {"name":"Steve"}

# 2. Update only if CAS token matches (no one else modified it)
cas user:123 0 3600 17 12345
{"name":"Steve D"}
# STORED (if token matched)
# EXISTS (if someone else modified it - CAS token changed)
# NOT_FOUND (if key was deleted)
```

This is crucial for scenarios like:
- Shopping cart updates
- Counter modifications with business logic
- Any read-modify-write operation

---

## Expiration Behavior

Memcached handles expiration with some nuances worth understanding:

```bash
# Expiration in seconds (up to 30 days)
set key 0 3600 5
value
# Expires in 1 hour

# Expiration as Unix timestamp (for > 30 days)
set key 0 1704067200 5
value
# Expires at specific timestamp

# No expiration
set key 0 0 5
value
# Never expires (but can still be evicted under memory pressure)
```

**The 30-Day Rule**: If exptime is greater than 30 days in seconds (2,592,000), Memcached interprets it as an absolute Unix timestamp rather than a relative offset. This catches many developers off guard.

**Lazy Expiration**: Memcached uses lazy expiration. Expired items aren't immediately deleted. They're removed when:
1. You try to access them (checked on retrieval)
2. Memory is needed and they're selected for eviction
3. A background task happens to check them

This means expired items may consume memory until accessed or evicted.

---

## Memory Management: Slab Allocation

Understanding slab allocation helps you optimize Memcached for your workload.

### How It Works

When Memcached starts, it pre-allocates memory into pages (typically 1MB each). Each page is divided into chunks of a specific size class:

```
Slab Class 1:  96 byte chunks
Slab Class 2:  120 byte chunks
Slab Class 3:  152 byte chunks
Slab Class 4:  192 byte chunks
...
Slab Class 42: 1MB chunks (maximum item size)
```

When you store an item, Memcached finds the smallest chunk that fits and uses one slot in that slab class.

### Why This Matters

**Internal fragmentation**: A 100-byte item uses a 120-byte chunk, wasting 20 bytes. With many items, this adds up.

**Slab calcification**: If your access patterns change, slabs assigned to one size class can't be reassigned. If you stored many 1KB items initially, those slabs can't help when you later need space for 100-byte items.

**Tuning**: For workloads with predictable item sizes, you can tune the growth factor (`-f` flag) to create size classes that better match your data.

```bash
# View slab statistics
stats slabs

# View item statistics per slab class
stats items
```

---

## Node.js Client Usage

The `memjs` library is a modern, maintained client for Node.js:

```javascript
import memjs from 'memjs';

// Connect to single server
const client = memjs.Client.create('localhost:11211');

// Connect to multiple servers (distributed)
const client = memjs.Client.create('server1:11211,server2:11211,server3:11211');

// With authentication (for services like MemCachier)
const client = memjs.Client.create('server:11211', {
  username: 'user',
  password: 'pass'
});
```

### Basic Operations

```javascript
// SET - Store a value
await client.set('user:123', JSON.stringify({ name: 'Steve' }), { expires: 3600 });

// GET - Retrieve a value
const { value, flags } = await client.get('user:123');
if (value) {
  const user = JSON.parse(value.toString());
  console.log(user.name); // "Steve"
}

// DELETE - Remove a value
await client.delete('user:123');

// ADD - Store only if doesn't exist
const added = await client.add('user:123', 'data', { expires: 3600 });
// Returns true if added, false if already exists

// REPLACE - Store only if exists
const replaced = await client.replace('user:123', 'new data', { expires: 3600 });
// Returns true if replaced, false if didn't exist

// INCREMENT
await client.set('counter', '0');
const newValue = await client.increment('counter', 1);
console.log(newValue); // 1

// DECREMENT
const decremented = await client.decrement('counter', 1);
console.log(decremented); // 0
```

### CAS (Optimistic Locking)

```javascript
// Get value with CAS token
const { value, cas } = await client.gets('user:123');

if (value) {
  const user = JSON.parse(value.toString());
  user.loginCount++;
  
  // Update only if no one else modified it
  try {
    await client.cas('user:123', JSON.stringify(user), { cas, expires: 3600 });
    console.log('Updated successfully');
  } catch (err) {
    if (err.message.includes('EXISTS')) {
      console.log('Conflict - someone else modified the value');
      // Retry logic here
    }
  }
}
```

### Multi-Get for Performance

Fetching multiple keys in parallel is crucial for performance:

```javascript
async function multiGet(client, keys) {
  const results = {};
  await Promise.all(
    keys.map(async (key) => {
      const { value } = await client.get(key);
      if (value) {
        results[key] = JSON.parse(value.toString());
      }
    })
  );
  return results;
}

// Usage
const users = await multiGet(client, ['user:1', 'user:2', 'user:3']);
```

---

## Common Patterns

### Cache-Aside (Lazy Loading)

The most common pattern—check cache first, fall back to database:

```javascript
async function getUser(id) {
  const cacheKey = `user:${id}`;
  
  // Check cache
  const { value } = await cache.get(cacheKey);
  if (value) {
    return JSON.parse(value.toString());
  }
  
  // Cache miss - fetch from database
  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  
  if (user) {
    // Store in cache for future requests
    await cache.set(cacheKey, JSON.stringify(user), { expires: 3600 });
  }
  
  return user;
}
```

### Write-Through

Update cache whenever you update the database:

```javascript
async function updateUser(id, data) {
  // Update database first
  const user = await db.query(
    'UPDATE users SET name = $1 WHERE id = $2 RETURNING *',
    [data.name, id]
  );
  
  // Then update cache
  await cache.set(`user:${id}`, JSON.stringify(user), { expires: 3600 });
  
  return user;
}
```

### Cache Stampede Prevention

When a popular cached item expires, many requests simultaneously hit the database. This is called a cache stampede or thundering herd.

**Solution 1: Locking**

Only one request fetches from database while others wait:

```javascript
async function getUserWithLock(id) {
  const cacheKey = `user:${id}`;
  const lockKey = `lock:${cacheKey}`;
  
  // Check cache
  let { value } = await cache.get(cacheKey);
  if (value) return JSON.parse(value.toString());
  
  // Try to acquire lock using ADD (only succeeds if key doesn't exist)
  const gotLock = await cache.add(lockKey, '1', { expires: 5 });
  
  if (gotLock) {
    try {
      // We have the lock - fetch from database
      const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
      await cache.set(cacheKey, JSON.stringify(user), { expires: 3600 });
      return user;
    } finally {
      await cache.delete(lockKey);
    }
  } else {
    // Someone else is fetching - wait and retry
    await sleep(100);
    return getUserWithLock(id);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**Solution 2: Probabilistic Early Expiration**

Randomly refresh items before they expire:

```javascript
async function getUserWithEarlyRefresh(id, ttl = 3600) {
  const cacheKey = `user:${id}`;
  const metaKey = `meta:${cacheKey}`;
  
  const [{ value }, { value: meta }] = await Promise.all([
    cache.get(cacheKey),
    cache.get(metaKey)
  ]);
  
  if (value) {
    const data = JSON.parse(value.toString());
    const setTime = meta ? parseInt(meta.toString()) : 0;
    const age = Date.now() - setTime;
    const remainingTtl = ttl * 1000 - age;
    
    // If less than 10% TTL remaining, 20% chance to refresh
    if (remainingTtl < ttl * 100 && Math.random() < 0.2) {
      // Refresh in background (don't await)
      refreshCache(id, cacheKey, metaKey, ttl);
    }
    
    return data;
  }
  
  return fetchAndCache(id, cacheKey, metaKey, ttl);
}
```

### Session Storage

```javascript
const SESSION_TTL = 86400; // 24 hours

async function createSession(userId) {
  const sessionId = crypto.randomUUID();
  const sessionData = {
    userId,
    createdAt: Date.now(),
    lastAccess: Date.now()
  };
  
  await cache.set(
    `session:${sessionId}`,
    JSON.stringify(sessionData),
    { expires: SESSION_TTL }
  );
  
  return sessionId;
}

async function getSession(sessionId) {
  const { value } = await cache.get(`session:${sessionId}`);
  if (!value) return null;
  
  const session = JSON.parse(value.toString());
  
  // Refresh session on access (sliding expiration)
  session.lastAccess = Date.now();
  await cache.set(
    `session:${sessionId}`,
    JSON.stringify(session),
    { expires: SESSION_TTL }
  );
  
  return session;
}

async function destroySession(sessionId) {
  await cache.delete(`session:${sessionId}`);
}
```

### Fragment Caching

Cache rendered HTML fragments to avoid expensive template rendering:

```javascript
async function getNavigation(user) {
  const cacheKey = `fragment:nav:${user.role}`;
  
  const { value } = await cache.get(cacheKey);
  if (value) {
    return value.toString();
  }
  
  // Render navigation HTML
  const html = await renderNavigation(user.role);
  
  // Cache for 1 hour
  await cache.set(cacheKey, html, { expires: 3600 });
  
  return html;
}
```

---

## Consistent Hashing

Understanding how keys are distributed across servers is essential for operating Memcached at scale.

### The Problem with Simple Hashing

Naive approach: `server = hash(key) % num_servers`

This breaks badly when you add or remove servers. If you go from 3 to 4 servers, approximately 75% of keys now map to different servers, causing massive cache misses.

### Consistent Hashing Solution

Consistent hashing arranges servers on a virtual ring (0 to 2^32). Each key is hashed to a position on the ring and assigned to the next server clockwise.

When a server is added or removed, only keys between it and its neighbor are affected—roughly 1/n of keys instead of nearly all of them.

### Virtual Nodes

To improve distribution, each physical server is represented by multiple virtual nodes on the ring. This prevents hotspots when servers have unequal capacity or when the hash function clusters servers together.

Modern clients handle this automatically:

```javascript
// Client automatically distributes keys across servers
const client = memjs.Client.create('server1:11211,server2:11211,server3:11211');
```

---

## Monitoring and Operations

### Key Statistics

Connect via telnet to inspect Memcached:

```bash
telnet localhost 11211

# General statistics
stats

# Important metrics:
# - cmd_get: Total GET commands
# - cmd_set: Total SET commands
# - get_hits: Successful GETs
# - get_misses: Failed GETs (key not found)
# - evictions: Items removed due to memory pressure
# - bytes: Current bytes used
# - limit_maxbytes: Maximum bytes allowed
# - curr_connections: Current open connections
```

### Key Metrics to Monitor

**Hit Rate**: `get_hits / (get_hits + get_misses)`
- Below 80%: Cache may be too small or TTLs too short
- Above 95%: Excellent efficiency

**Evictions**: Items removed to make room
- High evictions + low hit rate = need more memory
- Some evictions are normal and expected

**Memory Utilization**: `bytes / limit_maxbytes`
- Running near limit is expected
- Consistently at limit with high evictions = scale up

**Connections**: Current vs. maximum
- High connection count may indicate connection pooling issues

### Health Checks

```javascript
async function healthCheck() {
  try {
    const testKey = `health:${Date.now()}`;
    await cache.set(testKey, 'ok', { expires: 10 });
    const { value } = await cache.get(testKey);
    await cache.delete(testKey);
    
    return value && value.toString() === 'ok';
  } catch (err) {
    return false;
  }
}
```

---

## Comparison: Memcached vs Redis

| Feature | Memcached | Redis |
|---------|-----------|-------|
| Data Types | Strings only | Strings, Lists, Sets, Sorted Sets, Hashes, Streams |
| Threading | Multi-threaded | Single-threaded (mostly) |
| Persistence | None | RDB snapshots, AOF logging |
| Replication | None | Built-in master-replica |
| Pub/Sub | None | Built-in |
| Lua Scripting | None | Built-in |
| Memory Efficiency | Slab allocator | jemalloc |
| Max Item Size | 1MB default | 512MB |
| Clustering | Client-side only | Redis Cluster |

**Choose Memcached when:**
- You only need simple key-value caching
- You want multi-threaded performance
- You have existing Memcached infrastructure
- Simplicity is a priority

**Choose Redis when:**
- You need data structures
- You need persistence
- You need pub/sub or messaging
- You need more operational features

---

## Interview Questions

**Q: What is Memcached and when would you use it over Redis?**

A: Memcached is a distributed memory caching system that stores key-value pairs in RAM. It's simpler than Redis—only supports strings, has no persistence, and no complex data structures. Choose Memcached when you need simple key-value caching at massive scale, want multi-threaded performance on multi-core servers, or already have Memcached expertise. Choose Redis when you need data structures, persistence, pub/sub, or Lua scripting.

**Q: How does Memcached distribute keys across servers?**

A: Memcached servers don't communicate with each other—distribution happens entirely in the client using consistent hashing. The client hashes each key to a position on a virtual ring and assigns it to the nearest server. Consistent hashing ensures that adding or removing servers only affects approximately 1/n of keys rather than all of them.

**Q: Explain slab allocation in Memcached.**

A: Memcached pre-allocates memory into pages (1MB each), and pages are divided into fixed-size chunks called slabs. Each slab class has chunks of a specific size (96 bytes, 120 bytes, 152 bytes, etc.). When storing an item, Memcached uses the smallest chunk that fits. This eliminates memory fragmentation but can cause internal waste if item sizes don't align with chunk sizes. It also leads to "slab calcification" where slabs assigned to one size class can't be reassigned even if access patterns change.

**Q: What is cache stampede and how do you prevent it?**

A: Cache stampede (thundering herd) occurs when a popular cached item expires and many simultaneous requests hit the database to regenerate it. Prevention strategies include: (1) Locking—use ADD to ensure only one request fetches while others wait and retry; (2) Probabilistic early expiration—randomly refresh items before they actually expire; (3) Background refresh—proactively update cache before expiration; (4) Never expire—use explicit invalidation instead of TTL for critical items.

**Q: What happens when Memcached runs out of memory?**

A: Memcached uses LRU (Least Recently Used) eviction within each slab class. When a slab is full and needs to store a new item, the least recently accessed item in that slab class is evicted automatically. Memcached never returns "out of memory" errors—it simply evicts old data to make room. The application must handle cache misses gracefully since evicted data is lost.

**Q: How would you handle Memcached server failure?**

A: Since Memcached has no built-in replication, server failure means data loss for keys on that server. Strategies include: (1) Accept temporarily higher miss rate—the cache will rebuild from the database; (2) Use consistent hashing so only 1/n of keys are affected; (3) Run enough servers that losing one doesn't significantly impact overall hit rate; (4) Ensure your application handles cache misses gracefully; (5) For critical data requiring high availability, consider Redis with replication instead.

**Q: Explain the difference between ADD, SET, REPLACE, and CAS.**

A: SET stores a value unconditionally (overwrites if exists, creates if doesn't). ADD stores only if the key doesn't already exist—useful for implementing locks. REPLACE stores only if the key already exists—useful for updates that shouldn't create new entries. CAS (Check And Set) stores only if the key hasn't been modified since you read it—used for optimistic locking in read-modify-write operations to prevent race conditions.

**Q: What's the maximum item size in Memcached and why?**

A: The default maximum is 1MB, configurable up to 128MB with the `-I` flag. The limit exists because Memcached is designed for caching small to medium objects. Very large items defeat the purpose of caching (slow to serialize/deserialize, consume disproportionate memory, cause longer eviction times). If you need to cache large items, consider compression, chunking across multiple keys, or using a different storage system.

---

## Practice Project

Build an API response caching layer:

**Requirements:**
1. Cache GET endpoint responses with configurable TTL
2. Implement cache key generation from URL + query params
3. Add cache stampede protection
4. Support cache invalidation by URL pattern
5. Add hit/miss headers to responses
6. Implement cache warming for critical endpoints

**Concepts you'll use:**
- SET, GET, ADD, DELETE
- CAS for safe updates
- Multi-get for batch operations
- Consistent key naming

---

## Resources

- https://memcached.org (official documentation)
- https://github.com/memcached/memcached/wiki (detailed wiki)
- https://github.com/alevy/memjs (Node.js client)
- https://www.memcachier.com/documentation (hosted service with excellent docs)
- https://engineering.fb.com/2013/06/25/core-infra/scaling-memcache-at-facebook/ (Facebook's Memcached scaling paper)
