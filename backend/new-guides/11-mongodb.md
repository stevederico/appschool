# MongoDB - Interview Ready Guide

**1. Fundamentals** - What It Is, Documents vs Tables, When to Use

**2. CRUD Operations** - Insert, Find, Update, Delete

**3. Query Operators** - Comparison, Logical, Element, Array

**4. Update Operators** - Set, Unset, Push, Pull, Inc

**5. Indexes** - Single, Compound, Text, TTL Indexes

**6. Aggregation** - Pipeline Stages, $match, $group, $lookup

**7. Data Modeling** - Embedding vs Referencing, Schema Design

**8. Mongoose** - Schemas, Models, Validation, Middleware

**9. Transactions** - Multi-Document ACID, Sessions

**10. Interview Prep** - Common Questions, Practice Project

---

## What It Is

MongoDB is a document-oriented NoSQL database that stores data in flexible, JSON-like documents called BSON (Binary JSON). Unlike relational databases that store data in tables with fixed schemas, MongoDB lets you store documents with varying structures in collections.

A document in MongoDB looks like this:

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "Steve",
  "email": "steve@test.com",
  "age": 30,
  "address": {
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102"
  },
  "tags": ["developer", "ios", "javascript"],
  "createdAt": ISODate("2024-01-15T10:30:00Z")
}
```

This flexibility is MongoDB's defining characteristic. You don't need to define a schema upfront, and different documents in the same collection can have different fields. This makes MongoDB particularly well-suited for:

- Rapid prototyping and iterative development
- Applications with evolving data requirements
- Storing semi-structured or polymorphic data
- Horizontal scaling across distributed systems

---

## Documents vs Tables

Understanding the conceptual mapping from relational to document databases:

| Relational (SQL) | MongoDB |
|------------------|---------|
| Database | Database |
| Table | Collection |
| Row | Document |
| Column | Field |
| Primary Key | _id field |
| JOIN | Embedded documents or $lookup |
| Foreign Key | Reference (manual) |

### Relational Approach

```sql
-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100)
);

-- Addresses table (separate, linked by foreign key)
CREATE TABLE addresses (
  id INT PRIMARY KEY,
  user_id INT REFERENCES users(id),
  city VARCHAR(100),
  state VARCHAR(2)
);

-- Query requires JOIN
SELECT u.name, a.city 
FROM users u 
JOIN addresses a ON u.id = a.user_id;
```

### MongoDB Approach

```javascript
// Single document contains everything
{
  "_id": ObjectId("..."),
  "name": "Steve",
  "email": "steve@test.com",
  "address": {
    "city": "San Francisco",
    "state": "CA"
  }
}

// Query is simple - no joins needed
db.users.findOne({ name: "Steve" })
```

---

## When to Use MongoDB

### Good Fit

**Flexible Schema Requirements**: When data structure varies between records or evolves frequently. E-commerce products with different attributes, content management systems, user-generated content.

**Rapid Development**: Schema changes don't require migrations. Add fields on the fly. Great for MVPs and prototyping.

**Hierarchical Data**: Documents naturally represent nested data without complex joins. Blog posts with comments, organizational charts, product catalogs with categories.

**High Write Throughput**: MongoDB can handle high volumes of writes, especially with sharding.

**Horizontal Scaling**: Built-in sharding distributes data across machines. Scales out more easily than traditional SQL databases.

### Poor Fit

**Complex Transactions Across Documents**: While MongoDB supports multi-document ACID transactions (since 4.0), it's not as mature as PostgreSQL for complex transactional workloads.

**Heavy Aggregation/Analytics**: SQL databases with mature query optimizers often perform better for complex analytical queries.

**Strong Relational Requirements**: If your data is highly relational with many cross-references, a relational database may be more appropriate.

**Small Dataset, Simple Requirements**: For simple applications, SQLite or PostgreSQL may be simpler to operate.

---

## Core Operations (CRUD)

### Connecting (Node.js with native driver)

```javascript
import { MongoClient } from 'mongodb';

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("myapp");
    const users = db.collection("users");
    
    // Perform operations...
    
  } finally {
    await client.close();
  }
}
```

### Create (Insert)

```javascript
// Insert one document
const result = await users.insertOne({
  name: "Steve",
  email: "steve@test.com",
  age: 30,
  createdAt: new Date()
});
console.log(`Inserted with _id: ${result.insertedId}`);

// Insert many documents
const result = await users.insertMany([
  { name: "Alice", email: "alice@test.com", age: 25 },
  { name: "Bob", email: "bob@test.com", age: 35 },
  { name: "Charlie", email: "charlie@test.com", age: 28 }
]);
console.log(`Inserted ${result.insertedCount} documents`);
```

### Read (Find)

```javascript
// Find one document
const user = await users.findOne({ email: "steve@test.com" });

// Find multiple documents
const cursor = users.find({ age: { $gte: 25 } });
const results = await cursor.toArray();

// With projection (select specific fields)
const cursor = users.find(
  { age: { $gte: 25 } },
  { projection: { name: 1, email: 1, _id: 0 } }
);

// Sorting
const cursor = users.find({}).sort({ age: -1 }); // Descending

// Limiting and skipping (pagination)
const cursor = users.find({})
  .sort({ createdAt: -1 })
  .skip(20)
  .limit(10);

// Count documents
const count = await users.countDocuments({ age: { $gte: 25 } });
```

### Update

```javascript
// Update one document
const result = await users.updateOne(
  { email: "steve@test.com" },  // Filter
  { $set: { age: 31 } }         // Update
);
console.log(`Modified ${result.modifiedCount} document(s)`);

// Update many documents
const result = await users.updateMany(
  { age: { $lt: 30 } },
  { $set: { category: "young" } }
);

// Replace entire document (except _id)
await users.replaceOne(
  { email: "steve@test.com" },
  { name: "Steve D", email: "steve@test.com", age: 31 }
);

// Upsert (insert if not exists)
await users.updateOne(
  { email: "new@test.com" },
  { $set: { name: "New User", email: "new@test.com" } },
  { upsert: true }
);

// Find and modify (return the document)
const doc = await users.findOneAndUpdate(
  { email: "steve@test.com" },
  { $inc: { loginCount: 1 } },
  { returnDocument: 'after' }  // Return updated document
);
```

### Delete

```javascript
// Delete one document
const result = await users.deleteOne({ email: "steve@test.com" });
console.log(`Deleted ${result.deletedCount} document(s)`);

// Delete many documents
const result = await users.deleteMany({ age: { $lt: 18 } });

// Find and delete (return deleted document)
const doc = await users.findOneAndDelete({ email: "steve@test.com" });
```

---

## Query Operators

### Comparison Operators

```javascript
// Equal (implicit)
{ age: 30 }

// Explicit comparison
{ age: { $eq: 30 } }    // Equal
{ age: { $ne: 30 } }    // Not equal
{ age: { $gt: 25 } }    // Greater than
{ age: { $gte: 25 } }   // Greater than or equal
{ age: { $lt: 35 } }    // Less than
{ age: { $lte: 35 } }   // Less than or equal

// In array of values
{ status: { $in: ["active", "pending"] } }
{ status: { $nin: ["deleted", "banned"] } }
```

### Logical Operators

```javascript
// AND (implicit - multiple conditions)
{ age: { $gte: 25 }, status: "active" }

// Explicit AND
{ $and: [
  { age: { $gte: 25 } },
  { status: "active" }
]}

// OR
{ $or: [
  { age: { $lt: 18 } },
  { age: { $gt: 65 } }
]}

// NOT
{ age: { $not: { $gt: 30 } } }

// NOR (none of the conditions)
{ $nor: [
  { status: "deleted" },
  { status: "banned" }
]}
```

### Element Operators

```javascript
// Field exists
{ email: { $exists: true } }

// Field is specific type
{ age: { $type: "int" } }
{ age: { $type: "number" } }  // int or double
```

### Array Operators

```javascript
// Array contains value
{ tags: "javascript" }  // tags array contains "javascript"

// Array contains all values
{ tags: { $all: ["javascript", "react"] } }

// Array size
{ tags: { $size: 3 } }

// Element match (for array of objects)
{
  orders: {
    $elemMatch: {
      product: "laptop",
      quantity: { $gt: 1 }
    }
  }
}
```

### Text Search

```javascript
// Create text index first
await collection.createIndex({ title: "text", description: "text" });

// Search
const results = await collection.find({
  $text: { $search: "mongodb database" }
}).toArray();

// With score
const results = await collection.find(
  { $text: { $search: "mongodb" } },
  { projection: { score: { $meta: "textScore" } } }
).sort({ score: { $meta: "textScore" } }).toArray();
```

---

## Update Operators

### Field Update Operators

```javascript
// Set field value
{ $set: { name: "Steve", age: 31 } }

// Remove field
{ $unset: { temporaryField: "" } }

// Increment numeric field
{ $inc: { age: 1 } }           // Add 1
{ $inc: { balance: -50 } }     // Subtract 50

// Multiply
{ $mul: { price: 1.1 } }       // Increase by 10%

// Rename field
{ $rename: { "old_name": "new_name" } }

// Set only if inserting (upsert)
{ $setOnInsert: { createdAt: new Date() } }

// Min/Max (only update if new value is less/greater)
{ $min: { lowScore: 50 } }     // Set if 50 < current
{ $max: { highScore: 100 } }   // Set if 100 > current

// Current date
{ $currentDate: { lastModified: true } }
```

### Array Update Operators

```javascript
// Add to array (allows duplicates)
{ $push: { tags: "newTag" } }

// Add multiple
{ $push: { tags: { $each: ["tag1", "tag2"] } } }

// Add to array (no duplicates)
{ $addToSet: { tags: "uniqueTag" } }

// Remove from array
{ $pull: { tags: "oldTag" } }

// Remove multiple values
{ $pullAll: { tags: ["tag1", "tag2"] } }

// Remove first/last element
{ $pop: { tags: 1 } }   // Remove last
{ $pop: { tags: -1 } }  // Remove first

// Update specific array element
{ $set: { "tags.0": "firstTag" } }  // Update first element

// Update matching array element
await collection.updateOne(
  { _id: id, "items.productId": productId },
  { $set: { "items.$.quantity": 5 } }  // $ = matched element
);
```

---

## Indexes

Indexes dramatically improve query performance by allowing MongoDB to find documents without scanning every document.

### Creating Indexes

```javascript
// Single field index
await collection.createIndex({ email: 1 });  // 1 = ascending

// Compound index
await collection.createIndex({ lastName: 1, firstName: 1 });

// Unique index
await collection.createIndex({ email: 1 }, { unique: true });

// Text index
await collection.createIndex({ title: "text", description: "text" });

// TTL index (auto-delete after time)
await collection.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 86400 }  // Delete after 24 hours
);

// Sparse index (only index documents that have the field)
await collection.createIndex({ optionalField: 1 }, { sparse: true });

// Partial index (only index documents matching filter)
await collection.createIndex(
  { email: 1 },
  { partialFilterExpression: { status: "active" } }
);
```

### Index Management

```javascript
// List indexes
const indexes = await collection.indexes();

// Drop index
await collection.dropIndex("email_1");

// Drop all indexes (except _id)
await collection.dropIndexes();
```

### Query Explanation

```javascript
// Explain query execution
const explanation = await collection.find({ email: "test@test.com" })
  .explain("executionStats");

// Key things to look for:
// - "stage": "IXSCAN" (good - using index)
// - "stage": "COLLSCAN" (bad - scanning all documents)
// - "totalDocsExamined" vs "nReturned" (should be close)
```

### Index Best Practices

1. **Index fields you query frequently**
2. **Compound indexes should follow ESR rule**: Equality, Sort, Range
3. **Don't over-index**: Each index adds write overhead
4. **Use covered queries**: When possible, query only indexed fields
5. **Monitor with explain()**: Verify indexes are being used

---

## Aggregation Pipeline

The aggregation pipeline processes documents through a series of stages:

```javascript
const results = await collection.aggregate([
  { $match: { status: "active" } },           // Filter
  { $group: { _id: "$category", count: { $sum: 1 } } },  // Group
  { $sort: { count: -1 } },                   // Sort
  { $limit: 10 }                              // Limit
]).toArray();
```

### Common Stages

```javascript
// $match - Filter documents
{ $match: { age: { $gte: 21 } } }

// $project - Reshape documents
{ $project: {
  name: 1,
  email: 1,
  fullName: { $concat: ["$firstName", " ", "$lastName"] },
  _id: 0
}}

// $group - Group and aggregate
{ $group: {
  _id: "$category",
  count: { $sum: 1 },
  avgPrice: { $avg: "$price" },
  maxPrice: { $max: "$price" },
  items: { $push: "$name" }
}}

// $sort
{ $sort: { createdAt: -1 } }

// $limit and $skip
{ $limit: 10 }
{ $skip: 20 }

// $unwind - Deconstruct array
// Document: { tags: ["a", "b", "c"] }
{ $unwind: "$tags" }
// Becomes 3 documents: { tags: "a" }, { tags: "b" }, { tags: "c" }

// $lookup - Join collections
{ $lookup: {
  from: "orders",
  localField: "_id",
  foreignField: "userId",
  as: "userOrders"
}}

// $addFields - Add new fields
{ $addFields: {
  totalPrice: { $multiply: ["$price", "$quantity"] }
}}

// $count
{ $count: "totalDocuments" }
```

### Aggregation Example: Analytics

```javascript
// Get monthly sales summary
const salesSummary = await orders.aggregate([
  // Filter to this year
  { $match: {
    createdAt: { $gte: new Date("2024-01-01") }
  }},
  
  // Group by month
  { $group: {
    _id: { $month: "$createdAt" },
    totalRevenue: { $sum: "$total" },
    orderCount: { $sum: 1 },
    avgOrderValue: { $avg: "$total" }
  }},
  
  // Sort by month
  { $sort: { _id: 1 } },
  
  // Reshape output
  { $project: {
    month: "$_id",
    totalRevenue: { $round: ["$totalRevenue", 2] },
    orderCount: 1,
    avgOrderValue: { $round: ["$avgOrderValue", 2] },
    _id: 0
  }}
]).toArray();
```

---

## Data Modeling

### Embedding vs Referencing

**Embedding (Denormalization)**

Store related data in a single document:

```javascript
// Embedded comments
{
  _id: ObjectId("..."),
  title: "Blog Post",
  content: "...",
  comments: [
    { author: "Alice", text: "Great post!", date: ISODate("...") },
    { author: "Bob", text: "Thanks!", date: ISODate("...") }
  ]
}
```

**When to embed:**
- One-to-few relationships
- Data that's always accessed together
- Data that doesn't change frequently

**Referencing (Normalization)**

Store references to related documents:

```javascript
// User document
{
  _id: ObjectId("user1"),
  name: "Steve"
}

// Order document with reference
{
  _id: ObjectId("order1"),
  userId: ObjectId("user1"),  // Reference
  items: [...],
  total: 99.99
}
```

**When to reference:**
- One-to-many or many-to-many relationships
- Data that changes frequently
- Data accessed independently
- Large arrays that could exceed document size limit (16MB)

### Hybrid Approach

Often the best approach combines both:

```javascript
// Order with embedded items but referenced user
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),           // Reference to user
  userEmail: "steve@test.com",       // Denormalized for quick access
  items: [                           // Embedded (always accessed together)
    { productId: ObjectId("..."), name: "Widget", price: 9.99, quantity: 2 },
    { productId: ObjectId("..."), name: "Gadget", price: 19.99, quantity: 1 }
  ],
  total: 39.97
}
```

---

## Mongoose (ODM)

Mongoose provides schema validation, middleware, and more:

```javascript
import mongoose from 'mongoose';

// Connect
await mongoose.connect('mongodb://localhost:27017/myapp');

// Define schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  age: {
    type: Number,
    min: [0, 'Age cannot be negative'],
    max: 150
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  tags: [String],
  address: {
    city: String,
    state: String,
    zip: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add index
userSchema.index({ email: 1 });

// Add instance method
userSchema.methods.getPublicProfile = function() {
  return {
    name: this.name,
    email: this.email
  };
};

// Add static method
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email });
};

// Add middleware (hooks)
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Create model
const User = mongoose.model('User', userSchema);

// Usage
const user = new User({ name: 'Steve', email: 'steve@test.com' });
await user.save();

const users = await User.find({ age: { $gte: 21 } });
const user = await User.findByEmail('steve@test.com');
```

---

## Transactions

MongoDB supports multi-document ACID transactions (4.0+):

```javascript
const session = client.startSession();

try {
  session.startTransaction();
  
  // All operations use the session
  await accounts.updateOne(
    { _id: fromAccountId },
    { $inc: { balance: -amount } },
    { session }
  );
  
  await accounts.updateOne(
    { _id: toAccountId },
    { $inc: { balance: amount } },
    { session }
  );
  
  await transactions.insertOne({
    from: fromAccountId,
    to: toAccountId,
    amount,
    date: new Date()
  }, { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

## Interview Questions

**Q: What is MongoDB and how does it differ from SQL databases?**

A: MongoDB is a document-oriented NoSQL database storing data in flexible JSON-like documents (BSON). Unlike SQL databases with fixed schemas and tables, MongoDB collections can hold documents with varying structures. It excels at handling semi-structured data, horizontal scaling, and rapid development. Trade-offs include less mature transaction support (though improving) and potentially more complex queries for highly relational data.

**Q: When would you embed data vs reference it?**

A: Embed when: data is accessed together, one-to-few relationship, data doesn't change often. Reference when: one-to-many or many-to-many relationships, data changes frequently, documents would exceed 16MB limit, data is accessed independently. Often use hybrid: embed frequently accessed data, reference the rest.

**Q: Explain the aggregation pipeline.**

A: The aggregation pipeline processes documents through sequential stages. Each stage transforms the documents and passes results to the next. Common stages: `$match` (filter), `$group` (aggregate), `$project` (reshape), `$sort`, `$limit`, `$lookup` (join), `$unwind` (flatten arrays). More powerful than simple queries for analytics and complex transformations.

**Q: How do indexes work in MongoDB?**

A: Indexes store a small portion of the collection's data in an easy-to-traverse form. Without indexes, MongoDB scans every document (COLLSCAN). With indexes, it can jump directly to matching documents (IXSCAN). Types include single field, compound, text, geospatial, and TTL. Trade-off: faster reads, slower writes (index must be updated).

**Q: What's the difference between `find()` and `aggregate()`?**

A: `find()` is for simple queries: filtering, projection, sorting, pagination. `aggregate()` is for complex data processing: grouping, joining collections, computing new fields, reshaping documents. Use `find()` for straightforward CRUD, `aggregate()` for analytics and transformations.

**Q: How does MongoDB handle transactions?**

A: Since version 4.0, MongoDB supports multi-document ACID transactions. You start a session, begin a transaction, perform operations with that session, then commit or abort. All operations in a transaction either succeed together or fail together. However, transactions add overhead—design your schema to minimize their need.

**Q: What is sharding?**

A: Sharding distributes data across multiple machines for horizontal scaling. A shard key determines how documents are distributed. MongoDB routes queries to relevant shards. Benefits: handle more data, higher throughput. Challenges: choosing good shard key (affects query efficiency and data distribution), more operational complexity.

---

## Practice Project

Build a blog API with MongoDB:

**Requirements:**
1. Users, Posts, Comments collections
2. Embedded comments in posts (with limits)
3. User references in posts and comments
4. Text search on post title/content
5. Aggregation for post statistics
6. Pagination for posts list
7. Indexes for common queries

---

## Resources

- https://www.mongodb.com/docs/ (Official documentation)
- https://university.mongodb.com/ (Free courses)
- https://mongoosejs.com/docs/ (Mongoose documentation)
- https://www.mongodb.com/docs/manual/core/data-modeling-introduction/ (Data modeling guide)
