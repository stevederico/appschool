# Apache Kafka - Interview Ready Guide

**1. Fundamentals** - What It Is, Core Concepts (Topics, Partitions, Consumer Groups)

**2. When to Use** - Use Cases, Kafka vs RabbitMQ/SQS

**3. Node.js Usage** - KafkaJS, Producer, Consumer, Admin

**4. Message Patterns** - Pub/Sub, Request-Reply, Event Sourcing

**5. Reliability** - Error Handling, Exactly-Once Semantics

**6. Setup** - Docker Compose, Configuration

**7. Interview Prep** - Common Questions, Practice Project

---

## What It Is

Apache Kafka is a distributed event streaming platform capable of handling trillions of events per day. Originally developed at LinkedIn, it's now used by thousands of companies for high-performance data pipelines, streaming analytics, data integration, and mission-critical applications.

Kafka is fundamentally a distributed commit log. Producers write messages to topics, and consumers read from those topics. Unlike traditional message queues where messages are deleted after consumption, Kafka retains messages for a configurable period, allowing:

- Multiple consumers to read the same data
- Consumers to replay historical data
- Event sourcing architectures
- Stream processing applications

Think of Kafka as a highly scalable, fault-tolerant, real-time data highway.

---

## Core Concepts

### Topics and Partitions

```
Topic: orders
┌───────────────────────────────────────────────────────┐
│  Partition 0: [msg0][msg3][msg6][msg9] ...           │
│  Partition 1: [msg1][msg4][msg7][msg10] ...          │
│  Partition 2: [msg2][msg5][msg8][msg11] ...          │
└───────────────────────────────────────────────────────┘
```

**Topic**: Named category/feed of messages (like a table in a database)

**Partition**: Topics are split into partitions for parallelism
- Messages within a partition are ordered
- Each partition is an append-only log
- Partitions can be on different brokers (horizontal scaling)
- More partitions = more parallelism but more overhead

**Offset**: Sequential ID for each message in a partition
- Consumers track their position via offsets
- Offsets enable replay and exactly-once processing

### Producers and Consumers

```
Producers                    Kafka Cluster                 Consumers
┌──────────┐                ┌─────────────┐               ┌──────────┐
│ Producer │ ──── write ──▶ │   Topic     │ ◀── read ─── │ Consumer │
└──────────┘                │  Partition  │               │  Group A │
┌──────────┐                │             │               └──────────┘
│ Producer │ ──── write ──▶ │             │               ┌──────────┐
└──────────┘                └─────────────┘  ◀── read ─── │ Consumer │
                                                          │  Group B │
                                                          └──────────┘
```

**Producers**: Applications that publish messages to topics
- Choose partition via key (hash) or round-robin
- Can wait for acknowledgment (durability vs speed tradeoff)

**Consumers**: Applications that read messages from topics
- Part of a Consumer Group
- Partitions are distributed among consumers in a group
- Each partition is consumed by only one consumer in a group

### Consumer Groups

```
Topic with 4 partitions, Consumer Group with 3 consumers:

Partition 0 ──▶ Consumer A
Partition 1 ──▶ Consumer A
Partition 2 ──▶ Consumer B
Partition 3 ──▶ Consumer C

If Consumer B fails, its partitions are rebalanced:

Partition 0 ──▶ Consumer A
Partition 1 ──▶ Consumer A
Partition 2 ──▶ Consumer C  (rebalanced)
Partition 3 ──▶ Consumer C
```

- Each consumer group maintains its own offset per partition
- Multiple groups can read the same topic independently
- Adding consumers (up to partition count) increases throughput
- If consumers > partitions, some consumers are idle

### Brokers and Clusters

```
Kafka Cluster
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐       │
│  │ Broker 0  │  │ Broker 1  │  │ Broker 2  │       │
│  │           │  │           │  │           │       │
│  │ P0 (L)    │  │ P0 (F)    │  │ P1 (F)    │       │
│  │ P1 (L)    │  │ P2 (L)    │  │ P0 (F)    │       │
│  │ P2 (F)    │  │ P1 (F)    │  │ P2 (F)    │       │
│  └───────────┘  └───────────┘  └───────────┘       │
│                                                     │
│  L = Leader, F = Follower (replica)                │
└─────────────────────────────────────────────────────┘
```

**Broker**: A Kafka server that stores data and serves clients
**Cluster**: Multiple brokers working together
**Replication**: Each partition has replicas on other brokers
**Leader/Follower**: One leader handles reads/writes, followers replicate

---

## When to Use Kafka

### Good Fit

**Event Streaming**: Real-time data pipelines between systems
**Log Aggregation**: Collect logs from multiple services
**Metrics Collection**: Time-series data from applications
**Event Sourcing**: Store all state changes as events
**Stream Processing**: Real-time analytics and transformations
**Microservices Communication**: Decoupled async messaging
**Activity Tracking**: User behavior, clickstream data
**Commit Log**: Database replication, change data capture

### Poor Fit

**Simple Request/Response**: Use HTTP/gRPC instead
**Small Scale**: Overhead not worth it for few messages
**Strict Message Ordering Across Topics**: Only ordered within partition
**Very Low Latency (<10ms)**: In-memory queues may be faster

---

## Node.js Usage

### Installation

```bash
npm install kafkajs
```

### Producer

```javascript
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092', 'localhost:9093']
});

const producer = kafka.producer();

async function sendMessage() {
  await producer.connect();
  
  // Send single message
  await producer.send({
    topic: 'orders',
    messages: [
      { 
        key: 'order-123',    // Determines partition
        value: JSON.stringify({ 
          orderId: '123', 
          userId: 'user-1', 
          amount: 99.99 
        }),
        headers: {
          'correlation-id': 'abc-123'
        }
      }
    ]
  });
  
  // Send batch
  await producer.send({
    topic: 'orders',
    messages: [
      { key: 'order-1', value: JSON.stringify({ orderId: '1' }) },
      { key: 'order-2', value: JSON.stringify({ orderId: '2' }) },
      { key: 'order-3', value: JSON.stringify({ orderId: '3' }) }
    ]
  });
  
  await producer.disconnect();
}

// Producer with acknowledgment settings
const reliableProducer = kafka.producer({
  allowAutoTopicCreation: false,
  transactionTimeout: 30000
});

await reliableProducer.send({
  topic: 'orders',
  acks: -1,  // Wait for all replicas (safest)
  messages: [{ value: 'important message' }]
});

// acks: 0 = no wait (fastest, least safe)
// acks: 1 = wait for leader (balanced)
// acks: -1 = wait for all replicas (safest)
```

### Consumer

```javascript
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'order-processors' });

async function consume() {
  await consumer.connect();
  
  // Subscribe to topic(s)
  await consumer.subscribe({ 
    topic: 'orders', 
    fromBeginning: false  // true = start from earliest offset
  });
  
  // Subscribe to multiple topics
  await consumer.subscribe({ 
    topics: ['orders', 'payments', 'shipments']
  });
  
  // Process messages
  await consumer.run({
    eachMessage: async ({ topic, partition, message, heartbeat }) => {
      const value = JSON.parse(message.value.toString());
      const key = message.key?.toString();
      
      console.log({
        topic,
        partition,
        offset: message.offset,
        key,
        value,
        timestamp: message.timestamp
      });
      
      // Process the message
      await processOrder(value);
      
      // For long processing, call heartbeat to prevent rebalance
      await heartbeat();
    }
  });
}

// Batch processing (more efficient)
await consumer.run({
  eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning }) => {
    for (const message of batch.messages) {
      if (!isRunning()) break;
      
      await processMessage(message);
      resolveOffset(message.offset);
      await heartbeat();
    }
  }
});

// Graceful shutdown
const shutdown = async () => {
  await consumer.disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

### Admin Operations

```javascript
const admin = kafka.admin();
await admin.connect();

// Create topic
await admin.createTopics({
  topics: [
    {
      topic: 'orders',
      numPartitions: 3,
      replicationFactor: 2,
      configEntries: [
        { name: 'retention.ms', value: '604800000' }  // 7 days
      ]
    }
  ]
});

// List topics
const topics = await admin.listTopics();

// Describe topic
const metadata = await admin.fetchTopicMetadata({ topics: ['orders'] });

// Delete topic
await admin.deleteTopics({ topics: ['old-topic'] });

// Get consumer group offsets
const offsets = await admin.fetchOffsets({ 
  groupId: 'order-processors', 
  topics: ['orders'] 
});

// Reset offsets
await admin.setOffsets({
  groupId: 'order-processors',
  topic: 'orders',
  partitions: [
    { partition: 0, offset: '0' }  // Reset to beginning
  ]
});

await admin.disconnect();
```

---

## Message Patterns

### Event Notification

Simple notification that something happened:

```javascript
// Producer
await producer.send({
  topic: 'user-events',
  messages: [{
    key: userId,
    value: JSON.stringify({
      type: 'USER_REGISTERED',
      userId: '123',
      timestamp: Date.now()
    })
  }]
});

// Multiple consumers react independently
// - Email service sends welcome email
// - Analytics service tracks signups
// - Recommendation service initializes preferences
```

### Event-Carried State Transfer

Include data so consumers don't need to fetch:

```javascript
await producer.send({
  topic: 'order-events',
  messages: [{
    key: orderId,
    value: JSON.stringify({
      type: 'ORDER_CREATED',
      orderId: '123',
      userId: 'user-1',
      items: [
        { productId: 'prod-1', quantity: 2, price: 29.99 },
        { productId: 'prod-2', quantity: 1, price: 49.99 }
      ],
      totalAmount: 109.97,
      shippingAddress: { ... },
      timestamp: Date.now()
    })
  }]
});
```

### Command Pattern

Request action from specific service:

```javascript
// Producer sends command
await producer.send({
  topic: 'payment-commands',
  messages: [{
    key: orderId,
    value: JSON.stringify({
      type: 'PROCESS_PAYMENT',
      orderId: '123',
      amount: 109.97,
      paymentMethod: { ... }
    }),
    headers: {
      'reply-to': 'payment-responses',
      'correlation-id': correlationId
    }
  }]
});

// Consumer processes and responds
await consumer.run({
  eachMessage: async ({ message }) => {
    const command = JSON.parse(message.value.toString());
    const replyTo = message.headers['reply-to'].toString();
    const correlationId = message.headers['correlation-id'].toString();
    
    const result = await processPayment(command);
    
    await producer.send({
      topic: replyTo,
      messages: [{
        key: command.orderId,
        value: JSON.stringify({
          type: 'PAYMENT_RESULT',
          orderId: command.orderId,
          success: result.success
        }),
        headers: { 'correlation-id': correlationId }
      }]
    });
  }
});
```

---

## Error Handling

### Dead Letter Queue

Handle messages that can't be processed:

```javascript
const DLQ_TOPIC = 'orders-dlq';

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    try {
      await processMessage(message);
    } catch (error) {
      console.error('Processing failed:', error);
      
      // Send to dead letter queue
      await producer.send({
        topic: DLQ_TOPIC,
        messages: [{
          key: message.key,
          value: message.value,
          headers: {
            'original-topic': topic,
            'original-partition': String(partition),
            'original-offset': message.offset,
            'error-message': error.message,
            'failed-at': new Date().toISOString()
          }
        }]
      });
    }
  }
});
```

### Retry with Backoff

```javascript
async function processWithRetry(message, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await processMessage(message);
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

---

## Exactly-Once Semantics

```javascript
// Idempotent producer (prevents duplicates on retry)
const producer = kafka.producer({
  idempotent: true,
  maxInFlightRequests: 5
});

// Transactional producer (atomic writes across topics)
const producer = kafka.producer({
  idempotent: true,
  transactionalId: 'my-transactional-id'
});

await producer.connect();

const transaction = await producer.transaction();

try {
  await transaction.send({
    topic: 'orders',
    messages: [{ value: 'order data' }]
  });
  
  await transaction.send({
    topic: 'inventory',
    messages: [{ value: 'inventory update' }]
  });
  
  await transaction.commit();
} catch (error) {
  await transaction.abort();
  throw error;
}
```

---

## Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
    depends_on:
      - kafka
```

```bash
# Start
docker-compose up -d

# Create topic
docker exec -it kafka kafka-topics --create \
  --topic orders \
  --partitions 3 \
  --replication-factor 1 \
  --bootstrap-server localhost:9092

# List topics
docker exec -it kafka kafka-topics --list \
  --bootstrap-server localhost:9092

# Produce messages
docker exec -it kafka kafka-console-producer \
  --topic orders \
  --bootstrap-server localhost:9092

# Consume messages
docker exec -it kafka kafka-console-consumer \
  --topic orders \
  --from-beginning \
  --bootstrap-server localhost:9092
```

---

## Interview Questions

**Q: What is Kafka and when would you use it?**

A: Kafka is a distributed event streaming platform for high-throughput, fault-tolerant messaging. Use it for: real-time data pipelines between systems, event-driven architectures, log aggregation, stream processing, microservices communication, and event sourcing. It excels at high volume (millions of events/sec), durability (configurable retention), and allowing multiple consumers to read the same data.

**Q: Explain topics, partitions, and offsets.**

A: Topics are named feeds of messages (like database tables). Partitions divide topics for parallelism—messages within a partition are ordered, and partitions can be on different brokers. Offsets are sequential IDs for messages within a partition. Consumers track their position via offsets, enabling replay from any point and exactly-once processing.

**Q: How do consumer groups work?**

A: Consumer groups enable parallel consumption. Partitions are distributed among consumers in a group—each partition is read by exactly one consumer. If a consumer fails, its partitions are rebalanced to others. Multiple consumer groups can read the same topic independently, each maintaining their own offsets. Consumers in a group cannot exceed partition count.

**Q: How does Kafka ensure durability and fault tolerance?**

A: Replication: each partition has configurable replicas across brokers. One replica is leader (handles reads/writes), others are followers. If leader fails, a follower becomes leader. Producers can wait for acknowledgment from all replicas (acks=-1). Messages are persisted to disk. Retention policies keep data for specified time or size.

**Q: Explain message ordering guarantees.**

A: Kafka guarantees ordering within a partition only, not across partitions. Messages with the same key go to the same partition (hash of key). For global ordering, use single partition (limits throughput). For entity ordering (e.g., all events for one user ordered), use entity ID as message key. Consider partition count vs ordering needs.

**Q: How would you handle failed messages?**

A: Implement Dead Letter Queue (DLQ) pattern: if processing fails after retries, send to separate topic with error metadata. Monitor DLQ, fix issues, replay. Use idempotent processing so retries don't cause duplicates. Consider transactional processing for exactly-once semantics. Implement retry with exponential backoff before DLQ.

---

## Practice Project

Build an event-driven e-commerce system:

**Requirements:**
1. Order service publishes ORDER_CREATED events
2. Payment service consumes and processes payments
3. Inventory service updates stock
4. Notification service sends confirmations
5. Dead letter queue for failed processing
6. Idempotent consumers
7. Consumer group scaling
8. Monitoring and metrics

---

## Resources

- https://kafka.apache.org/documentation/ (Official docs)
- https://developer.confluent.io/ (Confluent tutorials)
- https://kafka.js.org/ (KafkaJS documentation)
- https://www.conduktor.io/ (Kafka GUI and learning)
