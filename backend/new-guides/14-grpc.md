# gRPC - Interview Ready Guide

**1. Fundamentals** - What It Is, Why gRPC Over REST, When to Use

**2. Protocol Buffers** - Message Types, Scalar Types, Compilation

**3. Service Definition** - RPC Methods, Request/Response

**4. Communication Patterns** - Unary, Server/Client Streaming, Bidirectional

**5. Node.js Implementation** - Server, Client, Proto Loading

**6. Error Handling** - Status Codes, Error Details

**7. Advanced** - Metadata (Headers), Deadlines

**8. Interview Prep** - Common Questions, Practice Project

---

## What It Is

gRPC (gRPC Remote Procedure Calls) is a high-performance, open-source framework developed by Google for building distributed systems. It allows you to call methods on a remote server as if they were local function calls, abstracting away the complexity of network communication.

Unlike REST APIs where you think in terms of resources and HTTP verbs (GET /users, POST /orders), gRPC focuses on actions—you define services with methods that can be called remotely:

```protobuf
service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc CreateUser(CreateUserRequest) returns (User);
  rpc ListUsers(ListUsersRequest) returns (stream User);
}
```

gRPC uses Protocol Buffers (protobuf) as its interface definition language and message format. Messages are serialized to a compact binary format, making gRPC significantly faster than JSON-based REST APIs for high-throughput scenarios.

---

## Why gRPC Over REST?

### Performance

| Aspect | REST (JSON) | gRPC (Protobuf) |
|--------|------------|-----------------|
| Serialization | Text-based, verbose | Binary, compact |
| Message size | Larger | 3-10x smaller |
| Parsing speed | Slower | Faster |
| Protocol | HTTP/1.1 typically | HTTP/2 |
| Connection | New per request | Multiplexed |

### Key Advantages

**Strong Typing**: The .proto file defines exact message structures. Both client and server know exactly what data to expect. No runtime type errors.

**Code Generation**: From one .proto file, generate client and server code for 10+ languages.

**HTTP/2 Features**: Multiplexing, header compression, bidirectional streaming.

**Streaming**: Native support for server streaming, client streaming, and bidirectional streaming.

### Trade-offs

- **Browser Support**: Requires gRPC-Web proxy for browsers
- **Human Readability**: Binary format isn't debuggable with curl
- **Learning Curve**: Protocol Buffers and HTTP/2 concepts to learn

---

## When to Use gRPC

**Good Fit:**
- Microservices communication
- Low-latency requirements
- Streaming data
- Polyglot environments
- Mobile applications

**Poor Fit:**
- Browser-first APIs
- Simple CRUD APIs
- Public APIs
- Quick prototyping

---

## Protocol Buffers (Protobuf)

### Basic Syntax

```protobuf
syntax = "proto3";

package user;

message User {
  int32 id = 1;
  string name = 2;
  string email = 3;
  UserRole role = 4;
  repeated string tags = 5;
  optional string phone = 6;
}

enum UserRole {
  USER_ROLE_UNSPECIFIED = 0;
  USER_ROLE_USER = 1;
  USER_ROLE_ADMIN = 2;
}
```

### Field Numbers

Field numbers identify fields in binary encoding:
- Once assigned, never change or reuse
- Numbers 1-15 use 1 byte (use for frequent fields)
- Numbers 16-2047 use 2 bytes

```protobuf
message User {
  reserved 3, 15, 9 to 11;  // Reserved numbers
  reserved "age";           // Reserved names
}
```

### Scalar Types

| Proto Type | Description |
|------------|-------------|
| double/float | Floating point |
| int32/int64 | Variable-length integers |
| uint32/uint64 | Unsigned integers |
| bool | Boolean |
| string | UTF-8 string |
| bytes | Arbitrary data |

### Complex Types

```protobuf
// Lists
repeated string tags = 1;

// Maps
map<string, User> users = 1;

// Oneof (only one field can be set)
message Query {
  oneof search {
    string text = 1;
    int32 id = 2;
  }
}
```

---

## Service Definition

```protobuf
service UserService {
  // Unary RPC
  rpc GetUser(GetUserRequest) returns (User);
  
  // Server streaming
  rpc ListUsers(ListUsersRequest) returns (stream User);
  
  // Client streaming
  rpc UploadUsers(stream User) returns (UploadResponse);
  
  // Bidirectional streaming
  rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}

message GetUserRequest {
  int32 id = 1;
}

message ListUsersRequest {
  int32 page_size = 1;
  string page_token = 2;
}
```

---

## Communication Patterns

### 1. Unary RPC
Simple request-response:
```
Client --Request--> Server
Client <--Response-- Server
```

### 2. Server Streaming
Single request, multiple responses:
```
Client --Request--> Server
Client <--Response 1-- Server
Client <--Response 2-- Server
Client <--Response N-- Server
```

### 3. Client Streaming
Multiple requests, single response:
```
Client --Request 1--> Server
Client --Request 2--> Server
Client --Request N--> Server
Client <--Response-- Server
```

### 4. Bidirectional Streaming
Both sides send multiple messages:
```
Client --Message--> Server
Client <--Message-- Server
(interleaved)
```

---

## Node.js Implementation

### Server

```javascript
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const packageDefinition = protoLoader.loadSync('./user.proto');
const proto = grpc.loadPackageDefinition(packageDefinition);

const users = new Map();

const userService = {
  getUser: (call, callback) => {
    const user = users.get(call.request.id);
    if (user) {
      callback(null, user);
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        message: 'User not found'
      });
    }
  },
  
  listUsers: (call) => {
    for (const user of users.values()) {
      call.write(user);
    }
    call.end();
  },
  
  chat: (call) => {
    call.on('data', (message) => {
      call.write({ text: `Echo: ${message.text}` });
    });
    call.on('end', () => call.end());
  }
};

const server = new grpc.Server();
server.addService(proto.UserService.service, userService);
server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  server.start();
});
```

### Client

```javascript
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const packageDefinition = protoLoader.loadSync('./user.proto');
const proto = grpc.loadPackageDefinition(packageDefinition);

const client = new proto.UserService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// Unary call
client.getUser({ id: 1 }, (err, user) => {
  if (err) console.error(err);
  else console.log('User:', user);
});

// Server streaming
const stream = client.listUsers({});
stream.on('data', (user) => console.log('User:', user));
stream.on('end', () => console.log('Done'));

// Bidirectional streaming
const chat = client.chat();
chat.on('data', (msg) => console.log('Received:', msg.text));
chat.write({ text: 'Hello!' });
```

---

## Error Handling

### gRPC Status Codes

| Code | Name | Description |
|------|------|-------------|
| 0 | OK | Success |
| 3 | INVALID_ARGUMENT | Invalid request |
| 4 | DEADLINE_EXCEEDED | Timeout |
| 5 | NOT_FOUND | Resource not found |
| 7 | PERMISSION_DENIED | No permission |
| 13 | INTERNAL | Internal error |
| 14 | UNAVAILABLE | Service unavailable |
| 16 | UNAUTHENTICATED | Invalid auth |

### Error Handling

```javascript
// Server
getUser: (call, callback) => {
  if (!call.request.id) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: 'ID required'
    });
  }
  // ...
};

// Client
client.getUser({ id: 999 }, (err, user) => {
  if (err) {
    if (err.code === grpc.status.NOT_FOUND) {
      console.log('User not found');
    }
  }
});
```

---

## Metadata (Headers)

```javascript
// Server - read metadata
getUser: (call, callback) => {
  const token = call.metadata.get('authorization')[0];
  // Verify token...
};

// Client - send metadata
const metadata = new grpc.Metadata();
metadata.set('authorization', 'Bearer token123');
client.getUser({ id: 1 }, metadata, callback);
```

---

## Deadlines

```javascript
// Client - set timeout
const deadline = new Date();
deadline.setSeconds(deadline.getSeconds() + 5);

client.getUser({ id: 1 }, { deadline }, (err, user) => {
  if (err?.code === grpc.status.DEADLINE_EXCEEDED) {
    console.log('Request timed out');
  }
});
```

---

## Interview Questions

**Q: What is gRPC and how does it differ from REST?**

A: gRPC is a high-performance RPC framework using Protocol Buffers for serialization and HTTP/2 for transport. Unlike REST (resource-oriented, JSON, HTTP/1.1), gRPC is action-oriented with strongly-typed contracts. Benefits: smaller payloads, faster serialization, HTTP/2 multiplexing, streaming support, code generation.

**Q: What are Protocol Buffers?**

A: Protocol Buffers is a language-neutral serialization format. Define message structures in .proto files, generate code for multiple languages. Binary format is 3-10x smaller than JSON. Field numbers identify fields—never reuse them.

**Q: Explain the four gRPC communication patterns.**

A: (1) Unary: single request, single response. (2) Server streaming: single request, multiple responses. (3) Client streaming: multiple requests, single response. (4) Bidirectional streaming: both sides send multiple messages independently.

**Q: When would you choose gRPC over REST?**

A: Choose gRPC for: microservices communication, polyglot environments, streaming requirements, low-latency systems, mobile apps. Stick with REST for: browser clients, public APIs, simple CRUD, quick prototyping.

**Q: How does gRPC handle errors?**

A: gRPC uses 16 status codes (OK, NOT_FOUND, INVALID_ARGUMENT, etc.). More structured than HTTP status codes. Servers return code and message; clients handle based on code.

---

## Practice Project

Build a real-time chat system with gRPC:
1. User authentication (unary)
2. Message streaming (bidirectional)
3. Room management (server streaming)
4. File uploads (client streaming)
5. Proper error handling
6. Timeout handling

---

## Resources

- https://grpc.io/docs/
- https://protobuf.dev/
- https://github.com/grpc/grpc-node
