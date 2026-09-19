# Redis - Interview Ready Guide

**1. Fundamentals** - What It Is, Memory-Speed Tradeoff, When to Use, When NOT to Use

**2. Data Types** - Strings, Hashes, Lists, Sets, Sorted Sets

**3. Features** - Key Expiration, Persistence (RDB, AOF)

**4. Patterns** - Cache-Aside, Write-Through, Rate Limiting, Distributed Lock, Sessions, Pub/Sub

**5. Operations** - Node.js Usage, Memory Management, High Availability

**6. Interview Prep** - Common Questions, Practice Project

---

## What It Is

Redis (Remote Dictionary Server) is an open-source, in-memory data structure store. Unlike traditional databases that store data on disk and load it into memory when needed, Redis keeps all data in RAM at all times. This architectural decision makes Redis extraordinarily fast—capable of handling millions of operations per second—but also means the amount of data you can store is limited by available memory.

What sets Redis apart from simple caching solutions is its support for rich data structures. While Memcached only stores strings, Redis natively supports strings, lists, sets, sorted sets, hashes, streams, and more. Each data structure comes with specialized commands optimized for common operations, allowing you to perform complex manipulations server-side rather than fetching data to your application and processing it there.

Redis operates as a single-threaded server, processing commands sequentially. This might sound like a limitation, but it's actually a feature: single-threaded execution eliminates race conditions and makes every operation atomic by default. The server is so efficient that the single thread rarely becomes a bottleneck—network latency typically dominates response time.

---

## The Memory-Speed Tradeoff

Understanding why Redis is fast requires understanding the memory hierarchy in modern computers. When your CPU needs data, it first checks its cache (nanoseconds), then RAM (tens of nanoseconds), then SSD (microseconds), then HDD (milliseconds). The difference between RAM and disk access is roughly 1000x.

Traditional databases optimize for storing more data than fits in memory. They use sophisticated caching, indexing, and query planning to minimize disk reads. Redis takes the opposite approach: by guaranteeing everything is in memory, it eliminates disk I/O entirely from the read path.

This tradeoff has implications:

**Benefits:**
- Sub-millisecond latency for most operations
- Predictable performance (no disk seeks)
- Simple mental model (it's just a fast dictionary)

**Costs:**
- Data limited by RAM (expensive at scale)
- Data loss risk if server crashes (mitigated by persistence options)
- Not suitable for data larger than memory

---

## When to Use Redis

### Caching
The most common use case. Instead of hitting your database for every request, check Redis first. If the data exists (cache hit), return it immediately. If not (cache miss), fetch from the database and store in Redis for next time.

```
Request → Check Redis → Hit? → Return cached data
                      → Miss? → Query DB → Store in Redis → Return data
```

### Session Storage
Web sessions need fast read/write access and automatic expiration. Redis excels here: store session data as a hash, set a TTL, and let Redis handle cleanup.

### Rate Limiting
Need to limit API requests to 100 per minute per user? Redis's atomic increment with expiration makes this trivial.

### Real-time Leaderboards
Sorted sets maintain elements in score order with O(log n) insertion. Perfect for gaming leaderboards, trending content, or any ranked data.

### Message Queues
Lists support blocking pop operations, making Redis usable as a lightweight message queue. For more robust messaging, Redis Streams provide consumer groups and acknowledgments.

### Pub/Sub
Real-time notifications, chat systems, live updates. Publishers send messages to channels, subscribers receive them instantly.

---

## When NOT to Use Redis

### Primary Database
Redis can persist data, but it's not designed as a primary database. It lacks the query capabilities, ACID guarantees (in the traditional sense), and storage efficiency of PostgreSQL or MongoDB.

### Data Larger Than Memory
If your dataset exceeds available RAM, Redis isn't the right tool. You'll either need to shard across multiple instances or use a disk-based database.

### Complex Queries
Redis has no query language. You can't say "find all users where age > 25 and city = 'SF'". You design your data structures around your access patterns.

### Strong Consistency Requirements
In clustered setups, Redis provides eventual consistency. If you need guaranteed consistency across nodes, look elsewhere.

---

## Core Data Types

### Strings

The simplest type. A string in Redis can hold any data: text, numbers, serialized JSON, even binary data up to 512MB.

```bash
# Set a value
SET user:1:name "Steve"

# Get it back
GET user:1:name
# Returns: "Steve"

# Set with expiration (seconds)
SETEX session:abc123 3600 "user_data_here"

# Set with expiration (milliseconds)
PSETEX session:abc123 3600000 "user_data_here"

# Only set if key doesn't exist (useful for locks)
SETNX lock:resource "owner_id"

# Only set if key exists
SET user:1:name "Steve" XX

# Set multiple keys atomically
MSET user:1:name "Steve" user:1:email "steve@test.com"

# Get multiple keys
MGET user:1:name user:1:email
```

**Numeric Operations:**

Redis recognizes when strings contain numbers and provides atomic arithmetic:

```bash
SET counter 0
INCR counter        # Returns 1
INCR counter        # Returns 2
INCRBY counter 10   # Returns 12
DECR counter        # Returns 11
INCRBYFLOAT price 0.99  # For decimals
```

These operations are atomic—even with concurrent clients, you'll never lose an increment.

### Hashes

Hashes store field-value pairs, like a dictionary within a key. Perfect for representing objects.

```bash
# Set fields
HSET user:1 name "Steve" email "steve@test.com" plan "pro"

# Get one field
HGET user:1 name
# Returns: "Steve"

# Get multiple fields
HMGET user:1 name email
# Returns: ["Steve", "steve@test.com"]

# Get all fields and values
HGETALL user:1
# Returns: {"name": "Steve", "email": "steve@test.com", "plan": "pro"}

# Check if field exists
HEXISTS user:1 name
# Returns: 1 (true)

# Get all field names
HKEYS user:1

# Get all values
HVALS user:1

# Increment a numeric field
HINCRBY user:1 login_count 1

# Delete a field
HDEL user:1 plan
```

**Why use hashes instead of separate keys?**

Consider storing a user with 10 fields. You could use 10 separate keys (`user:1:name`, `user:1:email`, etc.) or one hash (`user:1` with 10 fields).

The hash approach:
- Uses less memory (Redis optimizes small hashes)
- Allows atomic operations on the whole object
- Keeps related data together
- Reduces key namespace pollution

### Lists

Ordered collections of strings, implemented as linked lists. Efficient insertion/removal at both ends, but slow random access in the middle.

```bash
# Push to the left (head)
LPUSH queue:jobs "job3" "job2" "job1"
# List is now: ["job1", "job2", "job3"]

# Push to the right (tail)
RPUSH queue:jobs "job4"
# List is now: ["job1", "job2", "job3", "job4"]

# Pop from left (returns and removes)
LPOP queue:jobs
# Returns: "job1"

# Pop from right
RPOP queue:jobs
# Returns: "job4"

# Get range (0-indexed, -1 means last)
LRANGE queue:jobs 0 -1
# Returns all elements

LRANGE queue:jobs 0 2
# Returns first 3 elements

# Get length
LLEN queue:jobs

# Get element by index
LINDEX queue:jobs 0

# Blocking pop (waits up to 5 seconds for element)
BLPOP queue:jobs 5
```

**Use Cases:**
- Message queues (LPUSH + BRPOP)
- Activity feeds (LPUSH + LTRIM to keep last N)
- Undo functionality (push actions, pop to undo)

### Sets

Unordered collections of unique strings. Sets excel at membership testing, intersection, union, and difference operations.

```bash
# Add members
SADD tags:post:1 "javascript" "react" "nodejs"

# Check membership
SISMEMBER tags:post:1 "react"
# Returns: 1 (true)

# Get all members
SMEMBERS tags:post:1
# Returns: ["javascript", "react", "nodejs"] (order not guaranteed)

# Count members
SCARD tags:post:1
# Returns: 3

# Remove member
SREM tags:post:1 "nodejs"

# Set operations
SADD tags:post:2 "javascript" "typescript" "react"

# Intersection (common tags)
SINTER tags:post:1 tags:post:2
# Returns: ["javascript", "react"]

# Union (all tags)
SUNION tags:post:1 tags:post:2
# Returns: ["javascript", "react", "nodejs", "typescript"]

# Difference (in post:1 but not post:2)
SDIFF tags:post:1 tags:post:2
# Returns: ["nodejs"]

# Random member
SRANDMEMBER tags:post:1

# Pop random member
SPOP tags:post:1
```

**Use Cases:**
- Tags and categories
- Tracking unique visitors
- Friend lists and social connections
- Filtering (intersection of "users who like X" and "users in city Y")

### Sorted Sets

Like sets, but each member has an associated score. Members are unique, but scores can repeat. The set stays sorted by score automatically.

```bash
# Add members with scores
ZADD leaderboard 100 "alice" 85 "bob" 150 "charlie"

# Get rank (0-indexed, lowest score = rank 0)
ZRANK leaderboard "alice"
# Returns: 1

# Get reverse rank (highest score = rank 0)
ZREVRANK leaderboard "charlie"
# Returns: 0

# Get score
ZSCORE leaderboard "alice"
# Returns: 100

# Get range by rank (ascending)
ZRANGE leaderboard 0 -1
# Returns: ["bob", "alice", "charlie"]

# Get range with scores
ZRANGE leaderboard 0 -1 WITHSCORES
# Returns: ["bob", 85, "alice", 100, "charlie", 150]

# Get range by rank (descending)
ZREVRANGE leaderboard 0 2 WITHSCORES
# Returns top 3

# Get range by score
ZRANGEBYSCORE leaderboard 80 120
# Returns members with scores between 80 and 120

# Increment score
ZINCRBY leaderboard 10 "alice"
# Alice now has 110

# Count members in score range
ZCOUNT leaderboard 0 100
# Returns: 1 (just bob now)

# Remove member
ZREM leaderboard "bob"
```

**Why Sorted Sets Are Powerful:**

The underlying data structure (skip list) provides O(log n) insertion and O(log n) range queries. This means:
- Adding a score: O(log n)
- Getting rank: O(log n)
- Getting top N: O(log n + N)

A leaderboard with millions of players updates and queries in microseconds.

**Use Cases:**
- Leaderboards and rankings
- Priority queues
- Time-series data (score = timestamp)
- Rate limiting with sliding windows
- Trending content (score = popularity metric)

---

## Key Expiration

Any key can have a TTL (time to live). When the TTL expires, Redis automatically deletes the key.

```bash
# Set expiration in seconds
EXPIRE user:session:123 3600

# Set expiration in milliseconds
PEXPIRE user:session:123 3600000

# Set expiration to absolute Unix timestamp
EXPIREAT user:session:123 1704067200

# Check remaining TTL
TTL user:session:123
# Returns: seconds remaining, -1 if no expiry, -2 if key doesn't exist

# Remove expiration (make persistent)
PERSIST user:session:123

# Set value and expiration together
SETEX key 3600 "value"
SET key "value" EX 3600
```

**How Expiration Works Internally:**

Redis uses two strategies:
1. **Passive expiration**: When a key is accessed, Redis checks if it's expired and deletes it
2. **Active expiration**: Redis periodically samples random keys with TTLs and deletes expired ones

This hybrid approach balances memory reclamation with CPU usage.

---

## Persistence

Redis offers two persistence mechanisms to survive restarts.

### RDB (Snapshotting)

Periodically saves the entire dataset to a binary file (`dump.rdb`).

```bash
# Configuration in redis.conf
save 900 1      # Save if at least 1 key changed in 900 seconds
save 300 10     # Save if at least 10 keys changed in 300 seconds
save 60 10000   # Save if at least 10000 keys changed in 60 seconds

# Manual save (blocking)
SAVE

# Background save (non-blocking)
BGSAVE
```

**Pros:**
- Compact single file, great for backups
- Fast restarts (just load the file)
- Minimal performance impact during normal operation

**Cons:**
- Data loss between snapshots (up to minutes)
- Fork can be slow with large datasets

### AOF (Append Only File)

Logs every write operation. On restart, Redis replays the log to rebuild state.

```bash
# Configuration
appendonly yes
appendfsync always    # Fsync every write (safest, slowest)
appendfsync everysec  # Fsync every second (good compromise)
appendfsync no        # Let OS decide (fastest, least safe)
```

**Pros:**
- Minimal data loss (at most 1 second with `everysec`)
- Human-readable log
- Automatic rewriting to compact the file

**Cons:**
- Larger files than RDB
- Slower restarts (must replay all operations)
- Slightly lower write throughput

### Which to Choose?

- **Development**: Neither (data loss is fine)
- **Cache only**: Neither or RDB (data is reconstructible)
- **Important data**: Both (RDB for fast recovery, AOF for minimal loss)
- **Maximum durability**: AOF with `appendfsync always`

---

## Common Patterns

### Cache-Aside Pattern

The most common caching strategy:

```javascript
async function getUser(id) {
  const cacheKey = `user:${id}`;
  
  // 1. Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 2. Cache miss - fetch from database
  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  
  if (user) {
    // 3. Populate cache for next time
    await redis.setex(cacheKey, 3600, JSON.stringify(user));
  }
  
  return user;
}

// When updating, invalidate cache
async function updateUser(id, data) {
  await db.query('UPDATE users SET name = $1 WHERE id = $2', [data.name, id]);
  await redis.del(`user:${id}`);  // Invalidate
}
```

### Write-Through Pattern

Update cache and database together:

```javascript
async function updateUser(id, data) {
  // Update database
  const user = await db.query(
    'UPDATE users SET name = $1 WHERE id = $2 RETURNING *',
    [data.name, id]
  );
  
  // Update cache with fresh data
  await redis.setex(`user:${id}`, 3600, JSON.stringify(user));
  
  return user;
}
```

### Rate Limiting

Limit requests per time window:

```javascript
async function rateLimit(userId, limit = 100, windowSeconds = 60) {
  const key = `ratelimit:${userId}`;
  
  // Increment counter
  const current = await redis.incr(key);
  
  // Set expiry on first request
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }
  
  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    resetIn: await redis.ttl(key)
  };
}

// Usage in middleware
app.use(async (req, res, next) => {
  const result = await rateLimit(req.user.id);
  
  if (!result.allowed) {
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: result.resetIn 
    });
  }
  
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  next();
});
```

### Distributed Lock

Prevent concurrent execution of critical sections:

```javascript
async function acquireLock(resource, ttlMs = 10000) {
  const lockKey = `lock:${resource}`;
  const lockValue = crypto.randomUUID();
  
  // SET NX = only set if not exists
  const acquired = await redis.set(lockKey, lockValue, 'PX', ttlMs, 'NX');
  
  if (acquired) {
    return lockValue;  // Return token to release later
  }
  return null;  // Lock not acquired
}

async function releaseLock(resource, lockValue) {
  const lockKey = `lock:${resource}`;
  
  // Only delete if we own the lock (Lua script for atomicity)
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  
  await redis.eval(script, 1, lockKey, lockValue);
}

// Usage
const lock = await acquireLock('payment:user:123');
if (lock) {
  try {
    await processPayment();
  } finally {
    await releaseLock('payment:user:123', lock);
  }
} else {
  // Payment already being processed
}
```

### Session Storage

```javascript
const SESSION_TTL = 86400; // 24 hours

async function createSession(userId, data) {
  const sessionId = crypto.randomUUID();
  const sessionData = {
    userId,
    ...data,
    createdAt: Date.now()
  };
  
  await redis.setex(
    `session:${sessionId}`,
    SESSION_TTL,
    JSON.stringify(sessionData)
  );
  
  return sessionId;
}

async function getSession(sessionId) {
  const data = await redis.get(`session:${sessionId}`);
  if (!data) return null;
  
  // Refresh TTL on access
  await redis.expire(`session:${sessionId}`, SESSION_TTL);
  
  return JSON.parse(data);
}

async function destroySession(sessionId) {
  await redis.del(`session:${sessionId}`);
}
```

### Pub/Sub

Publish-subscribe messaging for real-time features:

```javascript
// Publisher (e.g., when a new message is sent)
async function notifyNewMessage(channelId, message) {
  await redis.publish(`channel:${channelId}`, JSON.stringify({
    type: 'new_message',
    data: message
  }));
}

// Subscriber (e.g., WebSocket server)
const subscriber = redis.duplicate();

subscriber.subscribe('channel:general', (err) => {
  if (err) console.error('Subscribe error:', err);
});

subscriber.on('message', (channel, message) => {
  const parsed = JSON.parse(message);
  
  // Broadcast to connected WebSocket clients
  wss.clients.forEach(client => {
    if (client.channel === channel) {
      client.send(message);
    }
  });
});
```

**Important:** Pub/Sub is fire-and-forget. If a subscriber is disconnected when a message is published, that message is lost. For durable messaging, use Redis Streams.

---

## Node.js Usage (ioredis)

```javascript
import Redis from 'ioredis';

// Basic connection
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'optional',
  db: 0  // Redis has 16 databases (0-15)
});

// Connection events
redis.on('connect', () => console.log('Connected to Redis'));
redis.on('error', (err) => console.error('Redis error:', err));

// Basic operations (all return Promises)
await redis.set('key', 'value');
const value = await redis.get('key');

// Pipeline (batch commands, single round trip)
const pipeline = redis.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.get('key1');
pipeline.get('key2');
const results = await pipeline.exec();
// results = [[null, 'OK'], [null, 'OK'], [null, 'value1'], [null, 'value2']]

// Transaction (atomic execution)
const tx = redis.multi();
tx.incr('counter');
tx.incr('counter');
tx.get('counter');
const txResults = await tx.exec();

// Lua scripting (atomic complex operations)
const script = `
  local current = redis.call('GET', KEYS[1])
  if current and tonumber(current) >= tonumber(ARGV[1]) then
    return redis.call('DECRBY', KEYS[1], ARGV[1])
  else
    return nil
  end
`;

// Deduct 10 from balance only if sufficient funds
const newBalance = await redis.eval(script, 1, 'user:1:balance', 10);
```

---

## Memory Management

When Redis approaches the memory limit, it needs a strategy for handling new writes.

```bash
# Set max memory
maxmemory 256mb

# Eviction policy
maxmemory-policy allkeys-lru
```

**Eviction Policies:**

| Policy | Behavior |
|--------|----------|
| noeviction | Return errors when memory limit reached |
| allkeys-lru | Evict least recently used keys |
| allkeys-lfu | Evict least frequently used keys |
| volatile-lru | Evict LRU among keys with TTL |
| volatile-lfu | Evict LFU among keys with TTL |
| allkeys-random | Evict random keys |
| volatile-random | Evict random keys with TTL |
| volatile-ttl | Evict keys with shortest TTL |

**Recommendations:**
- **Cache**: `allkeys-lru` or `allkeys-lfu`
- **Mixed (cache + persistent data)**: `volatile-lru`
- **No data loss acceptable**: `noeviction` (handle errors in app)

---

## High Availability

### Redis Sentinel

Automatic failover for master-replica setups:

```
           ┌──────────┐
           │ Sentinel │
           │ Cluster  │
           └────┬─────┘
                │ monitors
    ┌───────────┼───────────┐
    ▼           ▼           ▼
┌───────┐   ┌───────┐   ┌───────┐
│Master │──▶│Replica│   │Replica│
└───────┘   └───────┘   └───────┘
```

If master fails, Sentinels elect a new master from replicas.

### Redis Cluster

Horizontal scaling with automatic sharding:

```
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Node 1  │  │ Node 2  │  │ Node 3  │
│Slots 0- │  │Slots    │  │Slots    │
│  5460   │  │5461-    │  │10923-   │
│         │  │ 10922   │  │ 16383   │
└─────────┘  └─────────┘  └─────────┘
```

Keys are distributed across nodes using hash slots (16384 total).

---

## Interview Questions

**Q: What is Redis and why is it fast?**

A: Redis is an in-memory data structure store. It's fast because all data lives in RAM (no disk I/O), it's single-threaded (no lock contention), uses efficient data structures, and the protocol is simple (minimal parsing overhead).

**Q: Redis vs Memcached?**

A: Redis supports multiple data types (lists, sets, sorted sets, hashes), has persistence options, supports pub/sub, provides Lua scripting, and offers replication. Memcached is simpler, multi-threaded, and slightly faster for basic string operations. Choose Redis unless you specifically need Memcached's simplicity or multi-threading.

**Q: How do you handle cache invalidation?**

A: Several strategies: (1) TTL-based expiration—set reasonable TTLs and let data expire naturally; (2) Write-through—update cache when updating database; (3) Cache-aside with explicit invalidation—delete cache key on database update; (4) Pub/sub notifications—broadcast invalidation events to multiple app instances.

**Q: What happens when Redis runs out of memory?**

A: Depends on the `maxmemory-policy` setting. Options include returning errors (noeviction), evicting least recently used keys (allkeys-lru), evicting keys with TTLs first (volatile-lru), and others. For caching, allkeys-lru is typical.

**Q: Explain Redis pub/sub limitations.**

A: Pub/sub is fire-and-forget with no persistence. If a subscriber is disconnected, it misses messages. There's no acknowledgment mechanism. For durable messaging with guaranteed delivery, use Redis Streams instead, which support consumer groups and message acknowledgment.

**Q: How would you implement a distributed lock?**

A: Use SET with NX (only if not exists) and PX (expiration in milliseconds). Generate a unique value as the lock token. To release, use a Lua script that only deletes the key if the value matches (preventing releasing someone else's lock). For critical applications, consider the Redlock algorithm across multiple Redis instances.

**Q: What's the difference between RDB and AOF persistence?**

A: RDB takes point-in-time snapshots—compact files, fast recovery, but potential data loss between snapshots. AOF logs every write operation—minimal data loss, human-readable, but larger files and slower recovery. Production systems often use both: RDB for backups and fast recovery, AOF for minimal data loss.

**Q: How does Redis Cluster handle key distribution?**

A: Keys are assigned to one of 16384 hash slots using CRC16(key) mod 16384. Each node owns a subset of slots. When you add/remove nodes, slots are redistributed. Multi-key operations only work if all keys are in the same slot (use hash tags like `{user:1}:profile` and `{user:1}:settings` to ensure this).

---

## Practice Project

Build a real-time leaderboard system:

**Requirements:**
1. Submit scores for players
2. Get player rank
3. Get top N players
4. Get players around a specific rank
5. Real-time updates via pub/sub
6. Rate limit score submissions (max 1 per second per player)

**Commands you'll use:**
- ZADD, ZRANK, ZREVRANK, ZRANGE, ZREVRANGE
- PUBLISH, SUBSCRIBE
- SET with NX and EX for rate limiting

---

## Resources

- https://try.redis.io (interactive tutorial)
- https://redis.io/commands (complete command reference)
- https://university.redis.com (free official courses)
- https://redis.io/docs/manual/patterns (common patterns)
- https://github.com/redis/ioredis (Node.js client docs)
