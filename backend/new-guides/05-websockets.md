# WebSockets - Interview Ready Guide

**1. Fundamentals** - What It Is, How It Works, Handshake, Lifecycle

**2. When to Use** - Real-Time Apps, When NOT to Use

**3. Browser API** - Client-Side Implementation, Events, Reconnection

**4. Server Implementation** - Node.js ws Library, Broadcasting, Rooms

**5. Patterns** - Heartbeat, Reconnection, Message Queuing, Authentication

**6. Scaling** - Horizontal Scaling, Redis Pub/Sub, Load Balancing

**7. Alternatives** - SSE, Long Polling, WebRTC Comparison

**8. Security** - Authentication, Rate Limiting, Input Validation

**9. Interview Prep** - Common Questions, Practice Project

---

## What It Is

WebSockets provide a persistent, bidirectional communication channel between a client (typically a browser) and a server. Unlike HTTP, where the client must initiate every request, WebSockets allow both sides to send messages at any time once the connection is established.

The traditional HTTP model works like this:
```
Client: "Hey server, any new messages?"
Server: "Nope."
(1 second later)
Client: "Hey server, any new messages?"
Server: "Nope."
(1 second later)
Client: "Hey server, any new messages?"
Server: "Yes, here's one!"
```

This polling approach is inefficient—most requests return nothing, yet each consumes bandwidth and server resources.

WebSockets flip this model:
```
Client: "Let's open a connection."
Server: "Connected. I'll tell you when something happens."
(silence... server is doing other work)
Server: "Hey, new message arrived!"
Server: "Another one!"
Client: "Thanks, sending a reply..."
```

The connection stays open. Either side can send data instantly without the overhead of establishing new HTTP connections. This makes WebSockets ideal for real-time applications: chat, live notifications, collaborative editing, gaming, financial tickers, and any scenario where low latency matters.

---

## How WebSockets Work

### The Handshake

WebSocket connections begin with an HTTP request that gets "upgraded" to the WebSocket protocol:

**Client Request:**
```http
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

**Server Response:**
```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

The `101 Switching Protocols` response indicates success. From this point, the connection is no longer HTTP—it's a persistent WebSocket connection using a binary framing protocol.

### The Connection Lifecycle

```
1. CONNECTING  →  Client initiates handshake
2. OPEN        →  Handshake successful, can send/receive
3. CLOSING     →  One side initiated close
4. CLOSED      →  Connection terminated
```

### Message Framing

WebSocket messages can be:
- **Text frames**: UTF-8 encoded strings (most common)
- **Binary frames**: Raw bytes (for files, images, etc.)
- **Control frames**: Ping, pong (keepalive), close

Messages can be split across multiple frames for large payloads, but the WebSocket API handles this transparently—you receive complete messages.

---

## When to Use WebSockets

### Real-Time Chat
Messages appear instantly without polling. Users see typing indicators, presence status, and message delivery confirmations in real-time.

### Live Notifications
Push notifications the moment something happens: new email, stock price alert, social media mention, system alert.

### Collaborative Applications
Google Docs-style real-time collaboration. Multiple users editing simultaneously with changes appearing instantly.

### Gaming
Multiplayer games require sub-100ms latency. WebSockets provide the persistent, low-overhead connection needed for real-time game state synchronization.

### Financial Data
Stock tickers, cryptocurrency prices, trading platforms. Data must update continuously without polling delays.

### Live Dashboards
Real-time analytics, monitoring systems, IoT sensor data. Metrics update as events occur.

### Location Tracking
Ride-sharing apps, delivery tracking. Position updates stream continuously.

---

## When NOT to Use WebSockets

### Simple CRUD Operations
If you're just fetching and updating data that doesn't need to be real-time, HTTP REST is simpler and more cacheable.

### Infrequent Updates
If data changes rarely (every few minutes or hours), polling or Server-Sent Events (SSE) may be simpler.

### One-Way Server-to-Client
If you only need server-to-client updates (no client-to-server messaging), Server-Sent Events (SSE) is simpler and works over regular HTTP.

### When Firewalls Are Problematic
Some corporate firewalls and proxies don't handle WebSockets well. If you can't control the network environment, HTTP long-polling might be more reliable.

### Stateless Architecture Requirements
WebSockets are inherently stateful. If your architecture is built around stateless request/response patterns, introducing WebSockets adds complexity.

---

## Browser API

The browser provides a built-in `WebSocket` class:

### Basic Connection

```javascript
// Create connection
const ws = new WebSocket('wss://example.com/socket');

// Connection opened
ws.addEventListener('open', (event) => {
  console.log('Connected to server');
  ws.send('Hello server!');
});

// Receive messages
ws.addEventListener('message', (event) => {
  console.log('Received:', event.data);
  
  // Parse JSON if needed
  const data = JSON.parse(event.data);
});

// Connection closed
ws.addEventListener('close', (event) => {
  console.log('Disconnected:', event.code, event.reason);
});

// Handle errors
ws.addEventListener('error', (event) => {
  console.error('WebSocket error:', event);
});
```

### Sending Data

```javascript
// Send text
ws.send('Hello!');

// Send JSON (most common pattern)
ws.send(JSON.stringify({
  type: 'chat_message',
  content: 'Hello everyone!',
  timestamp: Date.now()
}));

// Send binary data
const buffer = new ArrayBuffer(8);
ws.send(buffer);

// Send Blob
const blob = new Blob(['binary data'], { type: 'application/octet-stream' });
ws.send(blob);
```

### Connection State

```javascript
// Check connection state
switch (ws.readyState) {
  case WebSocket.CONNECTING: // 0
    console.log('Connecting...');
    break;
  case WebSocket.OPEN: // 1
    console.log('Connected');
    break;
  case WebSocket.CLOSING: // 2
    console.log('Closing...');
    break;
  case WebSocket.CLOSED: // 3
    console.log('Disconnected');
    break;
}

// Wait for connection before sending
function sendWhenReady(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(message);
  } else {
    ws.addEventListener('open', () => ws.send(message), { once: true });
  }
}
```

### Closing Connection

```javascript
// Graceful close
ws.close(); // Uses default code 1000 (normal closure)

// Close with code and reason
ws.close(1000, 'User logged out');

// Close codes:
// 1000 - Normal closure
// 1001 - Going away (page navigation)
// 1002 - Protocol error
// 1003 - Unsupported data
// 1008 - Policy violation
// 1011 - Server error
```

---

## Server Implementation (Node.js)

The `ws` library is the most popular WebSocket implementation for Node.js:

```bash
npm install ws
```

### Basic Server

```javascript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws, request) => {
  console.log('Client connected from:', request.socket.remoteAddress);
  
  // Send welcome message
  ws.send(JSON.stringify({ type: 'welcome', message: 'Connected!' }));
  
  // Handle incoming messages
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    console.log('Received:', message);
    
    // Echo back
    ws.send(JSON.stringify({ type: 'echo', data: message }));
  });
  
  // Handle disconnect
  ws.on('close', (code, reason) => {
    console.log('Client disconnected:', code, reason.toString());
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log('WebSocket server running on ws://localhost:8080');
```

### Integrating with Express

```javascript
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Regular HTTP routes
app.get('/', (req, res) => {
  res.send('Hello HTTP!');
});

// WebSocket handling
wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    console.log('Received:', data.toString());
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### Broadcasting to All Clients

```javascript
function broadcast(wss, message) {
  const data = JSON.stringify(message);
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Usage
wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    
    // Broadcast to all clients
    broadcast(wss, {
      type: 'chat_message',
      user: message.user,
      content: message.content,
      timestamp: Date.now()
    });
  });
});
```

### Broadcasting to Others (Exclude Sender)

```javascript
function broadcastToOthers(wss, sender, message) {
  const data = JSON.stringify(message);
  
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}
```

---

## Common Patterns

### Message Protocol Design

Structure your messages consistently:

```javascript
// Message format
{
  type: 'message_type',    // What kind of message
  payload: { ... },        // The data
  timestamp: 1234567890,   // When it was sent
  id: 'unique-id'          // For tracking/acknowledgment
}

// Example message types
// Client → Server
{ type: 'chat:send', payload: { room: 'general', text: 'Hello!' } }
{ type: 'presence:typing', payload: { room: 'general', isTyping: true } }
{ type: 'room:join', payload: { room: 'general' } }

// Server → Client
{ type: 'chat:message', payload: { from: 'alice', text: 'Hello!' } }
{ type: 'presence:update', payload: { user: 'bob', status: 'online' } }
{ type: 'error', payload: { code: 'UNAUTHORIZED', message: '...' } }
```

### Message Handler Pattern

```javascript
// Server-side message routing
const handlers = {
  'chat:send': handleChatSend,
  'room:join': handleRoomJoin,
  'room:leave': handleRoomLeave,
  'presence:typing': handleTyping,
};

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    const handler = handlers[message.type];
    
    if (handler) {
      handler(ws, message.payload);
    } else {
      console.warn('Unknown message type:', message.type);
    }
  } catch (err) {
    console.error('Invalid message:', err);
    ws.send(JSON.stringify({ 
      type: 'error', 
      payload: { message: 'Invalid message format' }
    }));
  }
});

function handleChatSend(ws, payload) {
  // Validate, store, broadcast...
}
```

### Room/Channel Management

```javascript
const rooms = new Map(); // room name → Set of clients

function joinRoom(ws, roomName) {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Set());
  }
  rooms.get(roomName).add(ws);
  ws.rooms = ws.rooms || new Set();
  ws.rooms.add(roomName);
}

function leaveRoom(ws, roomName) {
  if (rooms.has(roomName)) {
    rooms.get(roomName).delete(ws);
    if (rooms.get(roomName).size === 0) {
      rooms.delete(roomName);
    }
  }
  if (ws.rooms) {
    ws.rooms.delete(roomName);
  }
}

function broadcastToRoom(roomName, message, excludeClient = null) {
  const clients = rooms.get(roomName);
  if (!clients) return;
  
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Clean up on disconnect
ws.on('close', () => {
  if (ws.rooms) {
    ws.rooms.forEach((room) => leaveRoom(ws, room));
  }
});
```

### Authentication

Authenticate during the handshake or immediately after connection:

**Option 1: Query Parameter (during handshake)**

```javascript
// Client
const ws = new WebSocket('wss://example.com/socket?token=jwt_token_here');

// Server
wss.on('connection', (ws, request) => {
  const url = new URL(request.url, 'http://localhost');
  const token = url.searchParams.get('token');
  
  try {
    const user = verifyJWT(token);
    ws.user = user;
    ws.send(JSON.stringify({ type: 'authenticated', user }));
  } catch (err) {
    ws.close(1008, 'Invalid token');
  }
});
```

**Option 2: First Message (after connection)**

```javascript
// Client
ws.addEventListener('open', () => {
  ws.send(JSON.stringify({ 
    type: 'auth', 
    token: 'jwt_token_here' 
  }));
});

// Server
ws.on('message', (data) => {
  const message = JSON.parse(data);
  
  if (!ws.authenticated) {
    if (message.type === 'auth') {
      try {
        ws.user = verifyJWT(message.token);
        ws.authenticated = true;
        ws.send(JSON.stringify({ type: 'auth:success' }));
      } catch (err) {
        ws.close(1008, 'Authentication failed');
      }
    } else {
      ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
    }
    return;
  }
  
  // Handle authenticated messages...
});
```

### Heartbeat/Ping-Pong

Keep connections alive and detect dead clients:

```javascript
// Server-side heartbeat
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

wss.on('connection', (ws) => {
  ws.isAlive = true;
  
  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      console.log('Client unresponsive, terminating');
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});
```

### Reconnection Logic (Client)

Connections drop. Handle it gracefully:

```javascript
class ReconnectingWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.reconnectInterval = options.reconnectInterval || 1000;
    this.maxReconnectInterval = options.maxReconnectInterval || 30000;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || Infinity;
    this.listeners = { open: [], close: [], message: [], error: [] };
    
    this.connect();
  }
  
  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.addEventListener('open', (e) => {
      console.log('Connected');
      this.reconnectAttempts = 0;
      this.listeners.open.forEach(fn => fn(e));
    });
    
    this.ws.addEventListener('close', (e) => {
      this.listeners.close.forEach(fn => fn(e));
      this.scheduleReconnect();
    });
    
    this.ws.addEventListener('message', (e) => {
      this.listeners.message.forEach(fn => fn(e));
    });
    
    this.ws.addEventListener('error', (e) => {
      this.listeners.error.forEach(fn => fn(e));
    });
  }
  
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }
    
    // Exponential backoff with jitter
    const delay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000,
      this.maxReconnectInterval
    );
    
    console.log(`Reconnecting in ${delay}ms...`);
    this.reconnectAttempts++;
    
    setTimeout(() => this.connect(), delay);
  }
  
  send(data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      console.warn('WebSocket not open, message not sent');
    }
  }
  
  on(event, callback) {
    this.listeners[event].push(callback);
  }
  
  close() {
    this.maxReconnectAttempts = 0; // Prevent reconnection
    this.ws.close();
  }
}

// Usage
const ws = new ReconnectingWebSocket('wss://example.com/socket');

ws.on('message', (e) => {
  console.log('Received:', e.data);
});

ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'hello' }));
});
```

---

## Scaling WebSockets

### The Challenge

WebSocket connections are stateful and tied to a specific server. If you have multiple servers, a message sent to one server can't reach clients connected to another server.

### Solution: Pub/Sub with Redis

Use Redis pub/sub to broadcast messages across all server instances:

```javascript
import { WebSocketServer } from 'ws';
import Redis from 'ioredis';

const wss = new WebSocketServer({ port: 8080 });
const pub = new Redis();
const sub = new Redis();

// Subscribe to Redis channel
sub.subscribe('chat');

// When Redis receives a message, broadcast to local clients
sub.on('message', (channel, message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

// When a client sends a message, publish to Redis
wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    // Publish to Redis (all servers receive this)
    pub.publish('chat', data.toString());
  });
});
```

```
┌─────────────────────────────────────────────────┐
│                    Redis                         │
│               (Pub/Sub Channel)                  │
└─────────────────────────────────────────────────┘
        ↑               ↑               ↑
        │               │               │
   ┌────┴────┐     ┌────┴────┐     ┌────┴────┐
   │ Server 1│     │ Server 2│     │ Server 3│
   └────┬────┘     └────┬────┘     └────┬────┘
        │               │               │
   ┌────┴────┐     ┌────┴────┐     ┌────┴────┐
   │Clients  │     │Clients  │     │Clients  │
   │ A, B, C │     │ D, E, F │     │ G, H, I │
   └─────────┘     └─────────┘     └─────────┘
```

### Sticky Sessions

An alternative to pub/sub is ensuring a client always connects to the same server. Load balancers can route based on:
- IP address
- Cookie
- URL parameter

This is simpler but less resilient—if a server dies, its clients must reconnect to a different server and lose their state.

---

## WebSockets vs Alternatives

### Server-Sent Events (SSE)

SSE provides one-way server-to-client streaming over HTTP:

```javascript
// Server (Express)
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  
  // Send events...
  sendEvent({ message: 'Hello!' });
});

// Client
const eventSource = new EventSource('/events');
eventSource.onmessage = (e) => {
  console.log(JSON.parse(e.data));
};
```

**SSE vs WebSockets:**
| Feature | SSE | WebSockets |
|---------|-----|------------|
| Direction | Server → Client only | Bidirectional |
| Protocol | HTTP | WebSocket (ws://) |
| Reconnection | Automatic | Manual |
| Binary data | No | Yes |
| Browser support | Good | Excellent |
| Proxy/firewall compatibility | Better | Can be problematic |

**Choose SSE when:** You only need server-to-client updates (notifications, live feeds).

**Choose WebSockets when:** You need bidirectional communication or binary data.

### HTTP Long Polling

The client makes a request, server holds it open until data is available:

```javascript
// Client
async function poll() {
  try {
    const response = await fetch('/poll');
    const data = await response.json();
    handleData(data);
  } finally {
    poll(); // Immediately poll again
  }
}
poll();

// Server
app.get('/poll', async (req, res) => {
  // Wait for data (with timeout)
  const data = await waitForData(30000);
  res.json(data);
});
```

**Long Polling vs WebSockets:**
- Long polling works through any firewall/proxy
- Higher latency and server overhead than WebSockets
- Use as fallback when WebSockets aren't available

---

## Security Considerations

### Use WSS (WebSocket Secure)

Always use `wss://` in production:
```javascript
// ❌ Don't use in production
const ws = new WebSocket('ws://example.com/socket');

// ✅ Use WSS
const ws = new WebSocket('wss://example.com/socket');
```

### Validate All Input

Never trust client messages:

```javascript
ws.on('message', (data) => {
  let message;
  try {
    message = JSON.parse(data);
  } catch {
    return ws.close(1003, 'Invalid JSON');
  }
  
  // Validate message structure
  if (!message.type || typeof message.type !== 'string') {
    return ws.send(JSON.stringify({ error: 'Invalid message type' }));
  }
  
  // Validate payload based on type
  if (message.type === 'chat:send') {
    if (!message.payload?.text || message.payload.text.length > 1000) {
      return ws.send(JSON.stringify({ error: 'Invalid message' }));
    }
    // Sanitize HTML to prevent XSS
    message.payload.text = sanitizeHtml(message.payload.text);
  }
  
  // Process validated message...
});
```

### Rate Limiting

Prevent abuse by limiting message rate:

```javascript
const rateLimiter = new Map();
const MAX_MESSAGES_PER_SECOND = 10;

ws.on('message', (data) => {
  const now = Date.now();
  const clientHistory = rateLimiter.get(ws) || [];
  
  // Remove messages older than 1 second
  const recentMessages = clientHistory.filter(t => now - t < 1000);
  
  if (recentMessages.length >= MAX_MESSAGES_PER_SECOND) {
    return ws.send(JSON.stringify({ 
      type: 'error', 
      message: 'Rate limit exceeded' 
    }));
  }
  
  recentMessages.push(now);
  rateLimiter.set(ws, recentMessages);
  
  // Process message...
});

ws.on('close', () => {
  rateLimiter.delete(ws);
});
```

### Origin Checking

Verify the request comes from your domain:

```javascript
wss.on('connection', (ws, request) => {
  const origin = request.headers.origin;
  
  if (origin !== 'https://yourdomain.com') {
    ws.close(1008, 'Invalid origin');
    return;
  }
  
  // Accept connection...
});
```

---

## Interview Questions

**Q: What are WebSockets and how do they differ from HTTP?**

A: WebSockets provide persistent, bidirectional communication between client and server. Unlike HTTP (request-response, client-initiated only), WebSockets maintain an open connection where both sides can send messages anytime. The connection starts as HTTP (the handshake) then upgrades to the WebSocket protocol. This eliminates the overhead of repeatedly establishing connections and enables real-time communication.

**Q: Explain the WebSocket handshake process.**

A: The client sends an HTTP GET request with `Upgrade: websocket` and `Connection: Upgrade` headers, plus a random `Sec-WebSocket-Key`. The server responds with HTTP 101 Switching Protocols, echoing the upgrade headers and sending a `Sec-WebSocket-Accept` header (a hash of the client's key). After this handshake, both sides switch to the WebSocket binary framing protocol.

**Q: When would you use WebSockets vs Server-Sent Events?**

A: Use WebSockets when you need bidirectional communication (chat, games, collaborative editing) or binary data transfer. Use SSE when you only need server-to-client updates (notifications, live feeds, stock tickers). SSE is simpler, works over standard HTTP, has automatic reconnection, and is more firewall-friendly, but it's one-way only.

**Q: How do you scale WebSockets across multiple servers?**

A: Since WebSocket connections are stateful and tied to specific servers, you need a way to broadcast messages across all instances. The common solution is pub/sub with Redis: when any server receives a message, it publishes to Redis; all servers subscribe to Redis and broadcast to their local clients. Alternatively, use sticky sessions to ensure clients always connect to the same server.

**Q: How do you handle authentication with WebSockets?**

A: Two main approaches: (1) Pass a JWT token in the connection URL query parameter and verify during the handshake—reject with `ws.close(1008)` if invalid. (2) Require the first message after connection to be an auth message with the token—close the connection if auth fails or times out. The query parameter approach is simpler; the first-message approach is cleaner for token refresh scenarios.

**Q: How do you handle dropped connections and reconnection?**

A: Implement heartbeat on the server (ping/pong frames every 30 seconds) to detect dead connections. On the client, implement reconnection logic with exponential backoff: start with 1 second delay, double it each attempt (up to a maximum), add random jitter to prevent thundering herd. Reset the delay counter on successful connection. Optionally queue messages while disconnected and send them after reconnection.

**Q: What security considerations are important for WebSockets?**

A: (1) Always use WSS (TLS) in production. (2) Validate the Origin header during handshake to prevent cross-site attacks. (3) Authenticate connections (don't trust just because connected). (4) Validate and sanitize all incoming messages—never trust client data. (5) Implement rate limiting to prevent abuse. (6) Set reasonable message size limits to prevent memory exhaustion.

---

## Practice Project

Build a real-time chat application:

**Requirements:**
1. Multiple chat rooms users can join/leave
2. Messages broadcast to room members only
3. User presence (online/offline status)
4. Typing indicators
5. Message history (store in Redis or database)
6. Authentication (JWT in query param)
7. Reconnection with message replay
8. Rate limiting

**Bonus:**
- Private direct messages
- Read receipts
- File sharing

---

## Resources

- https://developer.mozilla.org/en-US/docs/Web/API/WebSocket (MDN documentation)
- https://github.com/websockets/ws (Node.js ws library)
- https://socket.io (Higher-level library with fallbacks)
- https://www.rfc-editor.org/rfc/rfc6455 (WebSocket protocol specification)
- https://ably.com/topic/websockets (In-depth WebSocket guide)
