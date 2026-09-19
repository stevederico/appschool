# Express.js - Interview Ready Guide

**1. Fundamentals** - What It Is, Core Concepts, Request/Response Cycle

**2. Routing** - Route Methods, Parameters, Query Strings, Router

**3. Middleware** - Built-in, Custom, Error Handling Middleware

**4. Error Handling** - Sync/Async Errors, Error Middleware, Best Practices

**5. RESTful API Design** - Resource Routes, Status Codes, Validation

**6. Complete Example** - Full Application Structure

**7. Comparison** - Express vs Hono/Fastify

**8. Interview Prep** - Common Questions, Practice Project

---

## What It Is

Express is a minimal, flexible web application framework for Node.js. It provides a thin layer of fundamental web application features without obscuring Node.js capabilities. Express is the most popular Node.js framework, powering countless production applications from small APIs to large-scale services.

Express doesn't impose structure—you decide how to organize your code. It doesn't include an ORM, template engine, or authentication system by default. This minimalism is intentional: Express provides the essentials and lets you choose your own tools for everything else.

Here's a complete Express server in a few lines:

```javascript
import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

This simplicity is deceptive. Express can scale to handle complex applications with dozens of routes, middleware chains, and integrations. The key is understanding its core concepts: routing, middleware, and the request/response cycle.

---

## Core Concepts

### The Request/Response Cycle

Every HTTP interaction in Express follows this pattern:

```
Client Request
      |
      v
+------------------------------------------+
|           Middleware Stack               |
|  +------------------------------------+  |
|  |   Middleware 1 (logging)           |  |
|  +----------------+-------------------+  |
|                   | next()               |
|                   v                      |
|  +------------------------------------+  |
|  |   Middleware 2 (body parsing)      |  |
|  +----------------+-------------------+  |
|                   | next()               |
|                   v                      |
|  +------------------------------------+  |
|  |   Middleware 3 (auth)              |  |
|  +----------------+-------------------+  |
|                   | next()               |
|                   v                      |
|  +------------------------------------+  |
|  |   Route Handler (sends response)   |  |
|  +------------------------------------+  |
+------------------------------------------+
      |
      v
Response to Client
```

The request flows through middleware functions in order. Each middleware can:
- Execute code
- Modify the request/response objects
- End the request-response cycle
- Call `next()` to pass control to the next middleware

### The Request Object (req)

Contains information about the HTTP request:

```javascript
app.get('/users/:id', (req, res) => {
  // URL parameters (from route pattern)
  req.params.id         // "123" from /users/123
  
  // Query string parameters
  req.query.sort        // "name" from /users/123?sort=name
  req.query.limit       // "10" from /users/123?sort=name&limit=10
  
  // Request body (requires body-parsing middleware)
  req.body.username     // From POST/PUT JSON body
  
  // Headers
  req.headers['content-type']
  req.headers.authorization
  req.get('Content-Type') // Helper method
  
  // HTTP method and URL
  req.method            // "GET"
  req.path              // "/users/123"
  req.url               // "/users/123?sort=name"
  req.originalUrl       // Full original URL
  
  // Client info
  req.ip                // Client IP address
  req.hostname          // Host header
  req.protocol          // "http" or "https"
  
  // Cookies (requires cookie-parser middleware)
  req.cookies.sessionId
  
  // Custom properties (set by middleware)
  req.user              // Often set by auth middleware
});
```

### The Response Object (res)

Used to send responses back to the client:

```javascript
app.get('/example', (req, res) => {
  // Send text
  res.send('Hello World');
  
  // Send JSON (most common for APIs)
  res.json({ message: 'Hello', status: 'ok' });
  
  // Set status code
  res.status(201).json({ id: 1, created: true });
  res.status(404).json({ error: 'Not found' });
  
  // Send status only
  res.sendStatus(204); // No Content
  
  // Set headers
  res.set('X-Custom-Header', 'value');
  res.setHeader('Content-Type', 'text/html');
  
  // Set cookies
  res.cookie('sessionId', 'abc123', { 
    httpOnly: true,
    secure: true,
    maxAge: 3600000 
  });
  res.clearCookie('sessionId');
  
  // Redirect
  res.redirect('/login');
  res.redirect(301, '/new-location'); // Permanent redirect
  
  // Send file
  res.sendFile('/path/to/file.pdf');
  res.download('/path/to/file.pdf', 'report.pdf');
  
  // Render template (requires view engine)
  res.render('index', { title: 'Home', user: req.user });
});
```

---

## Routing

Routes define how your application responds to client requests at specific endpoints.

### Basic Routes

```javascript
// HTTP methods
app.get('/users', (req, res) => { /* GET /users */ });
app.post('/users', (req, res) => { /* POST /users */ });
app.put('/users/:id', (req, res) => { /* PUT /users/123 */ });
app.patch('/users/:id', (req, res) => { /* PATCH /users/123 */ });
app.delete('/users/:id', (req, res) => { /* DELETE /users/123 */ });

// Match all HTTP methods
app.all('/secret', (req, res, next) => {
  console.log('Accessing secret section...');
  next();
});
```

### Route Parameters

```javascript
// Required parameters
app.get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id });
});
// /users/123 -> { userId: "123" }

// Multiple parameters
app.get('/users/:userId/posts/:postId', (req, res) => {
  res.json({ 
    userId: req.params.userId,
    postId: req.params.postId 
  });
});
// /users/5/posts/42 -> { userId: "5", postId: "42" }
```

### express.Router

Organize routes into modular groups:

```javascript
// routes/users.js
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ users: [] });
});

router.get('/:id', (req, res) => {
  res.json({ id: req.params.id });
});

router.post('/', (req, res) => {
  res.status(201).json({ id: 1, ...req.body });
});

export default router;
```

```javascript
// app.js
import express from 'express';
import usersRouter from './routes/users.js';
import postsRouter from './routes/posts.js';

const app = express();

app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);

// Routes become:
// GET /api/users
// GET /api/users/:id
// POST /api/users
```

---

## Middleware

Middleware functions are the backbone of Express. They have access to the request, response, and the next middleware function.

### Middleware Signature

```javascript
function middleware(req, res, next) {
  // Do something
  next(); // Pass to next middleware
}

// Error-handling middleware (4 parameters)
function errorMiddleware(err, req, res, next) {
  // Handle error
}
```

### Application-Level Middleware

```javascript
// Runs for every request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Runs for specific path
app.use('/api', (req, res, next) => {
  console.log('API request');
  next();
});
```

### Built-in Middleware

```javascript
// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));
app.use('/assets', express.static('public/assets'));
```

### Common Third-Party Middleware

```javascript
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';

// CORS - Cross-Origin Resource Sharing
app.use(cors());
app.use(cors({
  origin: 'https://example.com',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Security headers
app.use(helmet());

// Request logging
app.use(morgan('dev'));      // Development
app.use(morgan('combined')); // Production

// Cookie parsing
app.use(cookieParser());

// Response compression
app.use(compression());
```

### Custom Middleware Examples

**Logging Middleware:**
```javascript
function logger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}

app.use(logger);
```

**Authentication Middleware:**
```javascript
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Use on specific routes
app.get('/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Use on all routes under a path
app.use('/api/protected', authenticate);
```

**Validation Middleware:**
```javascript
function validateUser(req, res, next) {
  const { email, password } = req.body;
  const errors = [];
  
  if (!email || !email.includes('@')) {
    errors.push('Valid email is required');
  }
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
}

app.post('/register', validateUser, (req, res) => {
  // Validation passed
});
```

**Rate Limiting:**
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later' }
});

app.use('/api', limiter);
```

---

## Error Handling

### Synchronous Errors

Express catches synchronous errors automatically:

```javascript
app.get('/error', (req, res) => {
  throw new Error('Something went wrong!');
  // Express catches this and passes to error handler
});
```

### Asynchronous Errors

For async code, you must pass errors to `next()`:

```javascript
// Using callbacks
app.get('/users/:id', (req, res, next) => {
  db.getUser(req.params.id, (err, user) => {
    if (err) return next(err);
    res.json(user);
  });
});

// Using promises
app.get('/users/:id', (req, res, next) => {
  db.getUser(req.params.id)
    .then(user => res.json(user))
    .catch(next); // Pass error to error handler
});

// Using async/await (requires wrapper or Express 5)
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await db.getUser(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});
```

### Async Handler Wrapper

Automatically catch async errors:

```javascript
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Now you don't need try/catch
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await db.getUser(req.params.id);
  res.json(user);
}));
```

### Error-Handling Middleware

Must have 4 parameters. Define after all other middleware:

```javascript
// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Usage in routes
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await db.getUser(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.json(user);
}));

// Error handler (define last)
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

### 404 Handler

Catch all unmatched routes (define before error handler):

```javascript
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});
```

---

## RESTful API Design

### CRUD Operations

```javascript
import { Router } from 'express';
const router = Router();

// GET /users - List all users
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, sort = 'createdAt' } = req.query;
  const users = await User.find()
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(Number(limit));
  
  res.json({
    data: users,
    page: Number(page),
    limit: Number(limit)
  });
});

// GET /users/:id - Get single user
router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

// POST /users - Create user
router.post('/', async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
});

// PUT /users/:id - Replace user (full update)
router.put('/:id', async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

// PATCH /users/:id - Partial update
router.patch('/:id', async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

// DELETE /users/:id - Delete user
router.delete('/:id', async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.status(204).send();
});

export default router;
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing or invalid auth |
| 403 | Forbidden | Auth valid but not permitted |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable Entity | Validation errors |
| 500 | Internal Server Error | Server-side error |

---

## Complete Application Example

```javascript
// app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/users', authenticate, usersRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
```

```javascript
// server.js
import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

```javascript
// middleware/auth.js
import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    next();
  };
}
```

```javascript
// middleware/errors.js
export function notFound(req, res, next) {
  res.status(404).json({ error: `Not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack 
    })
  });
}
```

---

## Express vs Hono/Fastify

Since you use Hono in Skateboard, here's a comparison:

| Feature | Express | Hono | Fastify |
|---------|---------|------|---------|
| Performance | Good | Excellent | Excellent |
| Bundle size | ~550KB | ~12KB | ~200KB |
| TypeScript | Add-on | Built-in | Built-in |
| Edge/Deno support | No | Yes | Limited |
| Ecosystem | Massive | Growing | Large |
| Learning curve | Low | Low | Medium |

Express concepts (routing, middleware) transfer directly to Hono and Fastify. Learn Express patterns, apply them anywhere.

---

## Interview Questions

**Q: What is Express.js and why would you use it?**

A: Express is a minimal, flexible web framework for Node.js. It provides routing, middleware support, and HTTP utilities without imposing application structure. Use it when you need full control over your stack, want a large ecosystem of middleware, or need something lightweight. It's the most popular Node.js framework with extensive documentation and community support.

**Q: Explain middleware in Express.**

A: Middleware functions have access to the request, response, and next function. They can execute code, modify req/res, end the cycle, or call next() to pass control forward. Middleware runs in order of definition. Common uses: logging, authentication, body parsing, error handling. Error-handling middleware has 4 parameters (err, req, res, next).

**Q: How do you handle errors in Express?**

A: Synchronous errors are caught automatically. For async code, pass errors to next(). Define error-handling middleware (4 parameters) after all routes. Common pattern: create an asyncHandler wrapper that catches promise rejections, custom error classes with status codes, centralized error handler that formats responses differently for dev/production.

**Q: What's the difference between app.use() and app.get()?**

A: `app.use()` matches all HTTP methods and matches paths that start with the specified path (like a prefix). `app.get()` only matches GET requests and requires an exact path match (or matches via route parameters). `app.use('/api')` matches `/api`, `/api/users`, `/api/anything`. `app.get('/api')` only matches exactly `/api`.

**Q: How do you structure a large Express application?**

A: Separate concerns: routes folder with Router modules, middleware folder for reusable middleware, controllers folder for business logic, models folder for data access. Use dependency injection for testability. Keep app.js focused on middleware setup and route mounting. Use environment variables for configuration. Consider feature-based organization for larger apps.

**Q: How do you secure an Express application?**

A: Use helmet for security headers, cors for controlled cross-origin access, rate limiting to prevent abuse, input validation/sanitization, parameterized queries to prevent injection, JWT or sessions for authentication, HTTPS in production, keep dependencies updated. Don't expose stack traces in production. Validate and sanitize all user input.

---

## Practice Project

Build a REST API for a todo application:

**Requirements:**
1. CRUD operations for todos
2. User authentication (JWT)
3. User-specific todos (users only see their own)
4. Validation middleware
5. Error handling with custom error classes
6. Rate limiting
7. Request logging
8. Pagination and filtering

---

## Resources

- https://expressjs.com/en/guide/routing.html (Official guide)
- https://expressjs.com/en/resources/middleware.html (Middleware list)
- https://github.com/goldbergyoni/nodebestpractices (Node.js best practices)
- https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs (MDN tutorial)
