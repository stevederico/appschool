# GraphQL - Interview Ready Guide

**1. Fundamentals** - What It Is, Core Concepts, Schema

**2. Queries** - Fields, Arguments, Aliases, Fragments

**3. Mutations** - Creating, Updating, Deleting Data

**4. Subscriptions** - Real-Time Updates

**5. Server** - Node.js Implementation, Resolvers, Context

**6. Client** - React with Apollo, useQuery, useMutation

**7. Performance** - N+1 Problem, DataLoader

**8. Error Handling** - Error Types, Union Types for Errors

**9. Best Practices** - Schema Design, GraphQL vs REST

**10. Interview Prep** - Common Questions, Practice Project

---

## What It Is

GraphQL is a query language for APIs and a runtime for executing those queries. Developed by Facebook in 2012 and open-sourced in 2015, GraphQL provides a more efficient and flexible alternative to REST APIs.

The core idea is simple: clients describe exactly what data they need, and the server returns precisely that—nothing more, nothing less.

**REST approach:**
```
GET /users/123
GET /users/123/posts
GET /users/123/followers
```
Three requests, possibly returning more data than needed.

**GraphQL approach:**
```graphql
query {
  user(id: "123") {
    name
    email
    posts(limit: 5) {
      title
    }
    followersCount
  }
}
```
One request, exactly the data needed.

GraphQL solves several REST pain points:
- **Over-fetching**: Getting more data than needed
- **Under-fetching**: Needing multiple requests for related data
- **Rigid endpoints**: Adding new requirements often means new endpoints
- **Documentation**: The schema serves as self-documenting API

---

## Core Concepts

### Schema Definition Language (SDL)

GraphQL uses a strongly-typed schema to define the API:

```graphql
# Custom scalar types
scalar DateTime

# Enum type
enum Status {
  DRAFT
  PUBLISHED
  ARCHIVED
}

# Object type
type User {
  id: ID!
  name: String!
  email: String!
  age: Int
  posts: [Post!]!
  createdAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String!
  status: Status!
  author: User!
  comments: [Comment!]!
  createdAt: DateTime!
}

type Comment {
  id: ID!
  text: String!
  author: User!
  post: Post!
}

# Input type (for mutations)
input CreatePostInput {
  title: String!
  content: String!
  status: Status = DRAFT
}

# Query type (read operations)
type Query {
  user(id: ID!): User
  users(limit: Int, offset: Int): [User!]!
  post(id: ID!): Post
  posts(status: Status): [Post!]!
}

# Mutation type (write operations)
type Mutation {
  createUser(name: String!, email: String!): User!
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: CreatePostInput!): Post
  deletePost(id: ID!): Boolean!
}

# Subscription type (real-time)
type Subscription {
  postCreated: Post!
  commentAdded(postId: ID!): Comment!
}
```

### Type System

```graphql
# Scalar types (built-in)
String    # UTF-8 string
Int       # 32-bit integer
Float     # Double-precision float
Boolean   # true or false
ID        # Unique identifier (serialized as String)

# Non-null modifier (!)
name: String!     # Cannot be null

# List modifier ([])
tags: [String]    # List of nullable strings, list itself nullable
tags: [String!]   # List of non-null strings, list itself nullable
tags: [String]!   # List of nullable strings, list cannot be null
tags: [String!]!  # List of non-null strings, list cannot be null
```

---

## Queries

Queries fetch data from the server:

### Basic Query

```graphql
# Query
query GetUser {
  user(id: "123") {
    name
    email
  }
}

# Response
{
  "data": {
    "user": {
      "name": "Steve",
      "email": "steve@test.com"
    }
  }
}
```

### Nested Queries

```graphql
query GetUserWithPosts {
  user(id: "123") {
    name
    posts {
      title
      comments {
        text
        author {
          name
        }
      }
    }
  }
}
```

### Query Variables

```graphql
# Query with variables
query GetUser($userId: ID!) {
  user(id: $userId) {
    name
    email
  }
}

# Variables (sent separately)
{
  "userId": "123"
}
```

### Aliases

Query the same field with different arguments:

```graphql
query GetUsers {
  admin: user(id: "1") {
    name
  }
  guest: user(id: "2") {
    name
  }
}

# Response
{
  "data": {
    "admin": { "name": "Admin User" },
    "guest": { "name": "Guest User" }
  }
}
```

### Fragments

Reusable field selections:

```graphql
fragment UserFields on User {
  id
  name
  email
}

query GetUsers {
  user1: user(id: "1") {
    ...UserFields
    posts {
      title
    }
  }
  user2: user(id: "2") {
    ...UserFields
  }
}
```

### Directives

Conditional field inclusion:

```graphql
query GetUser($userId: ID!, $includePosts: Boolean!) {
  user(id: $userId) {
    name
    email
    posts @include(if: $includePosts) {
      title
    }
    secretField @skip(if: true)
  }
}
```

---

## Mutations

Mutations modify data:

```graphql
# Create
mutation CreateUser {
  createUser(name: "Steve", email: "steve@test.com") {
    id
    name
    email
  }
}

# With input type
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    status
  }
}

# Variables
{
  "input": {
    "title": "My First Post",
    "content": "Hello, GraphQL!",
    "status": "PUBLISHED"
  }
}

# Update
mutation UpdatePost {
  updatePost(id: "123", input: { title: "Updated Title" }) {
    id
    title
  }
}

# Delete
mutation DeletePost {
  deletePost(id: "123")
}
```

---

## Subscriptions

Real-time updates via WebSockets:

```graphql
subscription OnPostCreated {
  postCreated {
    id
    title
    author {
      name
    }
  }
}

subscription OnCommentAdded($postId: ID!) {
  commentAdded(postId: $postId) {
    id
    text
    author {
      name
    }
  }
}
```

---

## Server Implementation (Node.js)

### Using Apollo Server

```javascript
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

// Type definitions
const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    posts: [Post!]!
    post(id: ID!): Post
  }

  type Mutation {
    createUser(name: String!, email: String!): User!
    createPost(title: String!, content: String!, authorId: ID!): Post!
  }
`;

// Sample data
const users = [
  { id: '1', name: 'Steve', email: 'steve@test.com' },
  { id: '2', name: 'Alice', email: 'alice@test.com' }
];

const posts = [
  { id: '1', title: 'GraphQL Intro', content: '...', authorId: '1' },
  { id: '2', title: 'Advanced GraphQL', content: '...', authorId: '1' }
];

// Resolvers
const resolvers = {
  Query: {
    users: () => users,
    user: (_, { id }) => users.find(u => u.id === id),
    posts: () => posts,
    post: (_, { id }) => posts.find(p => p.id === id)
  },
  
  Mutation: {
    createUser: (_, { name, email }) => {
      const user = { id: String(users.length + 1), name, email };
      users.push(user);
      return user;
    },
    createPost: (_, { title, content, authorId }) => {
      const post = { 
        id: String(posts.length + 1), 
        title, 
        content, 
        authorId 
      };
      posts.push(post);
      return post;
    }
  },
  
  // Field resolvers for relationships
  User: {
    posts: (parent) => posts.filter(p => p.authorId === parent.id)
  },
  
  Post: {
    author: (parent) => users.find(u => u.id === parent.authorId)
  }
};

// Create server
const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 }
});

console.log(`Server running at ${url}`);
```

### Resolver Arguments

```javascript
const resolvers = {
  Query: {
    user: (parent, args, context, info) => {
      // parent: Result from parent resolver (for nested fields)
      // args: Arguments passed to the field
      // context: Shared context (auth, dataloaders, etc.)
      // info: Query execution info (rarely used)
      
      return context.db.users.findById(args.id);
    }
  }
};
```

### Context for Authentication

```javascript
const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  context: async ({ req }) => {
    // Get auth token from headers
    const token = req.headers.authorization || '';
    
    // Verify and get user
    const user = await verifyToken(token);
    
    return {
      user,
      db,
      dataloaders: createDataLoaders()
    };
  }
});

// Use in resolvers
const resolvers = {
  Query: {
    me: (_, __, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      return context.user;
    }
  }
};
```

---

## Client Implementation (React)

### Apollo Client Setup

```javascript
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  cache: new InMemoryCache()
});

function App() {
  return (
    <ApolloProvider client={client}>
      <MyComponent />
    </ApolloProvider>
  );
}
```

### Queries with useQuery

```javascript
import { useQuery, gql } from '@apollo/client';

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;

function UserList() {
  const { loading, error, data, refetch } = useQuery(GET_USERS);
  
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  
  return (
    <ul>
      {data.users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// With variables
const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      name
      email
    }
  }
`;

function UserProfile({ userId }) {
  const { loading, error, data } = useQuery(GET_USER, {
    variables: { id: userId }
  });
  
  // ...
}
```

### Mutations with useMutation

```javascript
import { useMutation, gql } from '@apollo/client';

const CREATE_USER = gql`
  mutation CreateUser($name: String!, $email: String!) {
    createUser(name: $name, email: $email) {
      id
      name
      email
    }
  }
`;

function CreateUserForm() {
  const [createUser, { loading, error }] = useMutation(CREATE_USER, {
    // Update cache after mutation
    update(cache, { data: { createUser } }) {
      cache.modify({
        fields: {
          users(existingUsers = []) {
            const newUserRef = cache.writeFragment({
              data: createUser,
              fragment: gql`
                fragment NewUser on User {
                  id
                  name
                  email
                }
              `
            });
            return [...existingUsers, newUserRef];
          }
        }
      });
    }
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await createUser({
      variables: { name: 'Steve', email: 'steve@test.com' }
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
      {error && <p>Error: {error.message}</p>}
    </form>
  );
}
```

### Subscriptions with useSubscription

```javascript
import { useSubscription, gql } from '@apollo/client';

const POST_CREATED = gql`
  subscription OnPostCreated {
    postCreated {
      id
      title
      author {
        name
      }
    }
  }
`;

function NewPostNotification() {
  const { data, loading } = useSubscription(POST_CREATED);
  
  if (loading) return null;
  
  return (
    <div className="notification">
      New post: {data.postCreated.title} by {data.postCreated.author.name}
    </div>
  );
}
```

---

## N+1 Problem and DataLoader

### The Problem

```graphql
query {
  posts {      # 1 query for posts
    title
    author {   # N queries for authors (one per post!)
      name
    }
  }
}
```

If you have 100 posts, this executes 101 queries.

### The Solution: DataLoader

```javascript
import DataLoader from 'dataloader';

// Batch function: receives array of keys, returns array of results
const userLoader = new DataLoader(async (userIds) => {
  const users = await db.users.findByIds(userIds);
  // Must return in same order as input ids
  return userIds.map(id => users.find(u => u.id === id));
});

// In context
const context = {
  loaders: {
    user: new DataLoader(batchUsers)
  }
};

// In resolver
const resolvers = {
  Post: {
    author: (post, _, context) => {
      return context.loaders.user.load(post.authorId);
    }
  }
};
```

Now 100 posts result in just 2 queries: one for posts, one batched query for all authors.

---

## Error Handling

### Server-Side Errors

```javascript
import { GraphQLError } from 'graphql';

const resolvers = {
  Query: {
    user: async (_, { id }, context) => {
      const user = await context.db.users.findById(id);
      
      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: {
            code: 'NOT_FOUND',
            argumentName: 'id'
          }
        });
      }
      
      return user;
    }
  },
  
  Mutation: {
    createPost: async (_, args, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      
      // ...
    }
  }
};
```

### Response Format

```json
{
  "data": {
    "user": null
  },
  "errors": [
    {
      "message": "User not found",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["user"],
      "extensions": {
        "code": "NOT_FOUND",
        "argumentName": "id"
      }
    }
  ]
}
```

---

## Best Practices

### Schema Design

```graphql
# Use specific types over generic
type User {
  # Good: clear return type
  posts(first: Int!, after: String): PostConnection!
  
  # Avoid: unclear what "data" contains
  # data: JSON
}

# Pagination with connections (Relay spec)
type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
}

type PostEdge {
  cursor: String!
  node: Post!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}

# Use input types for mutations
input CreatePostInput {
  title: String!
  content: String!
}

type Mutation {
  createPost(input: CreatePostInput!): CreatePostPayload!
}

type CreatePostPayload {
  post: Post
  errors: [Error!]
}
```

### Performance

1. **Use DataLoader** to batch and cache database queries
2. **Limit query depth** to prevent malicious deep queries
3. **Implement query complexity analysis** for rate limiting
4. **Use persisted queries** in production
5. **Enable response caching** where appropriate

---

## GraphQL vs REST

| Aspect | REST | GraphQL |
|--------|------|---------|
| Endpoints | Multiple endpoints | Single endpoint |
| Data fetching | Fixed response | Client specifies fields |
| Over-fetching | Common | Eliminated |
| Under-fetching | Common (multiple requests) | Single request |
| Versioning | URL or header versioning | Schema evolution |
| Caching | HTTP caching | Requires implementation |
| File upload | Native support | Requires extension |
| Learning curve | Lower | Higher |
| Tooling | Mature | Growing rapidly |

---

## Interview Questions

**Q: What is GraphQL and how does it differ from REST?**

A: GraphQL is a query language for APIs where clients request exactly the data they need. Unlike REST with multiple endpoints returning fixed structures, GraphQL has a single endpoint and clients specify required fields. This eliminates over-fetching (getting extra data) and under-fetching (needing multiple requests). Trade-offs: more complex setup, caching is harder, potential for expensive queries.

**Q: Explain the GraphQL type system.**

A: GraphQL has scalar types (String, Int, Float, Boolean, ID), object types (custom shapes), enums, input types (for mutations), interfaces, and unions. The `!` modifier means non-null, `[]` means list. Schema defines all types and operations (Query, Mutation, Subscription). Strong typing enables validation, introspection, and better tooling.

**Q: What is a resolver and how does it work?**

A: Resolvers are functions that return data for schema fields. They receive four arguments: parent (result from parent resolver), args (field arguments), context (shared data like auth, database), and info (query metadata). For nested fields, resolvers chain: parent resolver runs first, its result becomes the parent argument for child resolvers.

**Q: Explain the N+1 problem in GraphQL.**

A: When fetching related data (e.g., posts with authors), naive resolvers query the database for each relationship: 1 query for posts, N queries for N authors. Solution: DataLoader batches multiple individual loads into single queries and caches within a request. 100 posts becomes 2 queries (posts + batched authors) instead of 101.

**Q: How do you handle authentication in GraphQL?**

A: Typically through context. Extract auth token from headers in context function, verify it, and attach user to context. Resolvers check context.user for protected operations. Can also use directive-based auth (`@auth` directive) or schema-based middleware. Authentication is a server concern, not GraphQL-specific.

**Q: What are subscriptions?**

A: Subscriptions enable real-time updates via persistent connections (usually WebSockets). Clients subscribe to events; server pushes data when events occur. Useful for chat, notifications, live updates. More complex infrastructure than queries/mutations (requires WebSocket server, pub/sub system).

**Q: How do you prevent malicious queries?**

A: Several strategies: query depth limiting (reject queries nested too deep), query complexity analysis (assign costs to fields, reject expensive queries), timeout limits, rate limiting, persisted queries (only allow pre-approved queries in production), and disabling introspection in production.

---

## Practice Project

Build a social media API with GraphQL:

**Requirements:**
1. Users, Posts, Comments, Likes
2. Authentication with JWT
3. Pagination (cursor-based)
4. Real-time comment subscriptions
5. DataLoader for batching
6. Input validation
7. Error handling with proper codes

---

## Resources

- https://graphql.org/learn/ (Official documentation)
- https://www.apollographql.com/docs/ (Apollo documentation)
- https://www.howtographql.com/ (Free tutorial)
- https://github.com/graphql/dataloader (DataLoader)
