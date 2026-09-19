# AWS (Amazon Web Services) - Interview Ready Guide

**1. Fundamentals** - What It Is, Core Concepts (Regions, AZs, IAM)

**2. Essential Services** - EC2, S3, RDS, Lambda, DynamoDB, ElastiCache

**3. Networking** - VPC, Subnets, Security Groups, Load Balancers

**4. Security** - IAM, Roles, Policies, Secrets Manager

**5. Containers** - ECS, EKS, Fargate

**6. Messaging** - SQS, SNS, EventBridge

**7. Monitoring** - CloudWatch, X-Ray

**8. Interview Prep** - Common Architectures, Questions, Practice Project

---

## What It Is

AWS is the world's leading cloud computing platform, offering over 200 services from data centers globally. It provides on-demand computing resources—servers, storage, databases, networking, and more—that you can provision in minutes and pay for by the hour or second.

Instead of buying physical servers, you rent virtual ones. Instead of managing your own data centers, AWS handles the infrastructure. This shift from capital expenditure (buying hardware) to operational expenditure (paying for what you use) transformed how companies build and scale software.

AWS dominates the cloud market (~32% share), followed by Azure (~22%) and Google Cloud (~10%). Most companies use AWS or have AWS components in their stack.

---

## Core Concepts

### Regions and Availability Zones

```
AWS Global Infrastructure:
├── Region (us-east-1, eu-west-1, ap-northeast-1, etc.)
│   ├── Availability Zone (us-east-1a)
│   │   └── Data Center(s)
│   ├── Availability Zone (us-east-1b)
│   │   └── Data Center(s)
│   └── Availability Zone (us-east-1c)
│       └── Data Center(s)
```

**Region**: Geographic area (e.g., US East, Europe, Asia). Choose based on:
- Latency to users
- Data residency requirements
- Service availability
- Pricing

**Availability Zone (AZ)**: Isolated data centers within a region. Deploy across multiple AZs for high availability.

### The Shared Responsibility Model

```
┌─────────────────────────────────────────────┐
│           Customer Responsibility           │
│  - Data                                     │
│  - Application code                         │
│  - IAM (users, permissions)                 │
│  - Operating system patches                 │
│  - Network configuration                    │
│  - Encryption                               │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│             AWS Responsibility              │
│  - Physical security                        │
│  - Hardware                                 │
│  - Networking infrastructure                │
│  - Virtualization layer                     │
│  - Managed service operations               │
└─────────────────────────────────────────────┘
```

---

## Essential Services

### EC2 (Elastic Compute Cloud)

Virtual servers in the cloud.

```bash
# Launch instance via CLI
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type t3.micro \
  --key-name my-key-pair \
  --security-group-ids sg-0123456789abcdef0 \
  --subnet-id subnet-0123456789abcdef0
```

**Instance Types:**
| Family | Use Case | Example |
|--------|----------|---------|
| t3, t4g | General purpose, burstable | Web servers, dev |
| m5, m6i | General purpose, balanced | Production apps |
| c5, c6i | Compute optimized | CPU-intensive |
| r5, r6i | Memory optimized | Databases, caching |
| p4, g5 | GPU instances | ML, graphics |

**Pricing Models:**
- **On-Demand**: Pay by the hour/second, no commitment
- **Reserved**: 1-3 year commitment, up to 75% discount
- **Spot**: Bid on unused capacity, up to 90% discount (can be interrupted)
- **Savings Plans**: Flexible commitment for savings

**Key Concepts:**
- **AMI (Amazon Machine Image)**: Template for instances
- **Security Groups**: Virtual firewall for instances
- **Key Pairs**: SSH access to instances
- **EBS (Elastic Block Store)**: Persistent storage volumes
- **Elastic IP**: Static public IP address

### S3 (Simple Storage Service)

Object storage for any amount of data.

```javascript
// Node.js SDK example
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'us-east-1' });

// Upload file
await s3.send(new PutObjectCommand({
  Bucket: 'my-bucket',
  Key: 'images/photo.jpg',
  Body: fileBuffer,
  ContentType: 'image/jpeg'
}));

// Generate presigned URL (temporary access)
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const url = await getSignedUrl(s3, new GetObjectCommand({
  Bucket: 'my-bucket',
  Key: 'images/photo.jpg'
}), { expiresIn: 3600 });
```

**Storage Classes:**
| Class | Use Case | Availability |
|-------|----------|--------------|
| Standard | Frequently accessed | 99.99% |
| Intelligent-Tiering | Unknown access patterns | 99.9% |
| Standard-IA | Infrequent access | 99.9% |
| One Zone-IA | Infrequent, single AZ | 99.5% |
| Glacier | Archive, minutes retrieval | 99.99% |
| Glacier Deep Archive | Long-term archive, hours | 99.99% |

**Key Features:**
- Versioning
- Lifecycle policies (auto-transition between classes)
- Cross-region replication
- Static website hosting
- Event notifications (trigger Lambda)

### RDS (Relational Database Service)

Managed relational databases.

```bash
# Create PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier mydb \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password secret123 \
  --allocated-storage 20
```

**Supported Engines:**
- PostgreSQL
- MySQL
- MariaDB
- Oracle
- SQL Server
- Aurora (AWS's cloud-native database)

**Key Features:**
- Automated backups
- Multi-AZ deployment (standby replica)
- Read replicas (scale reads)
- Automatic patching
- Encryption at rest and in transit

### Lambda

Serverless compute—run code without managing servers.

```javascript
// Lambda function (Node.js)
export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  
  const name = event.queryStringParameters?.name || 'World';
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `Hello, ${name}!` })
  };
};
```

**Triggers:**
- API Gateway (HTTP requests)
- S3 (file uploads)
- DynamoDB Streams
- SQS (queue messages)
- EventBridge (scheduled events)
- SNS (notifications)

**Key Limits:**
- Timeout: 15 minutes max
- Memory: 128MB - 10GB
- Package size: 50MB zipped, 250MB unzipped
- Concurrent executions: 1000 default (can increase)

**Pricing:** Pay per request and compute time (GB-seconds).

### DynamoDB

Managed NoSQL database with single-digit millisecond latency.

```javascript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

// Put item
await docClient.send(new PutCommand({
  TableName: 'Users',
  Item: {
    userId: '123',
    email: 'steve@test.com',
    name: 'Steve'
  }
}));

// Get item
const { Item } = await docClient.send(new GetCommand({
  TableName: 'Users',
  Key: { userId: '123' }
}));

// Query (requires partition key)
const { Items } = await docClient.send(new QueryCommand({
  TableName: 'Orders',
  KeyConditionExpression: 'userId = :uid',
  ExpressionAttributeValues: { ':uid': '123' }
}));
```

**Key Concepts:**
- **Partition Key**: Required, distributes data
- **Sort Key**: Optional, enables range queries
- **GSI (Global Secondary Index)**: Query on non-key attributes
- **LSI (Local Secondary Index)**: Alternate sort key

**Capacity Modes:**
- **On-Demand**: Pay per request, auto-scaling
- **Provisioned**: Specify read/write capacity units

### API Gateway

Create, publish, and manage APIs.

```yaml
# Serverless Framework example
service: my-api

provider:
  name: aws
  runtime: nodejs18.x

functions:
  hello:
    handler: handler.hello
    events:
      - http:
          path: hello
          method: get
          cors: true
```

**Types:**
- **REST API**: Full-featured, request/response transformations
- **HTTP API**: Simpler, cheaper, faster
- **WebSocket API**: Real-time bidirectional

**Features:**
- Request validation
- Rate limiting and throttling
- API keys and usage plans
- Custom domain names
- Caching

---

## Networking

### VPC (Virtual Private Cloud)

Your isolated network in AWS.

```
VPC (10.0.0.0/16)
├── Public Subnet (10.0.1.0/24) - AZ-a
│   ├── Internet Gateway
│   ├── NAT Gateway
│   └── EC2 instances (public IP)
├── Private Subnet (10.0.2.0/24) - AZ-a
│   └── EC2 instances, RDS
├── Public Subnet (10.0.3.0/24) - AZ-b
│   └── EC2 instances (public IP)
└── Private Subnet (10.0.4.0/24) - AZ-b
    └── EC2 instances, RDS
```

**Components:**
- **Subnets**: Subdivisions of VPC, tied to AZ
- **Internet Gateway**: Connects VPC to internet
- **NAT Gateway**: Allows private subnet outbound internet access
- **Route Tables**: Control traffic routing
- **Security Groups**: Instance-level firewall (stateful)
- **Network ACLs**: Subnet-level firewall (stateless)

### Load Balancing

**Application Load Balancer (ALB):**
- Layer 7 (HTTP/HTTPS)
- Path-based routing
- Host-based routing
- WebSocket support

**Network Load Balancer (NLB):**
- Layer 4 (TCP/UDP)
- Ultra-low latency
- Static IP support

```
Users → Route 53 (DNS) → ALB → Target Groups → EC2 Instances
                                            → Lambda
                                            → ECS Containers
```

---

## Security

### IAM (Identity and Access Management)

Control who can do what.

```json
// IAM Policy - Allow S3 read access to specific bucket
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-bucket",
        "arn:aws:s3:::my-bucket/*"
      ]
    }
  ]
}
```

**Components:**
- **Users**: Individual accounts
- **Groups**: Collections of users
- **Roles**: Temporary credentials for services/users
- **Policies**: JSON documents defining permissions

**Best Practices:**
- Use roles for applications (not access keys)
- Follow least privilege
- Enable MFA
- Rotate credentials regularly
- Use IAM Access Analyzer

### Secrets Manager

Store and rotate secrets securely.

```javascript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

const response = await client.send(new GetSecretValueCommand({
  SecretId: 'prod/myapp/database'
}));

const secret = JSON.parse(response.SecretString);
// { username: 'admin', password: '...' }
```

---

## Containers

### ECS (Elastic Container Service)

Run Docker containers on AWS.

```json
// Task Definition
{
  "family": "my-app",
  "containerDefinitions": [
    {
      "name": "web",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/my-app:latest",
      "memory": 512,
      "cpu": 256,
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" }
      ]
    }
  ]
}
```

**Launch Types:**
- **Fargate**: Serverless containers (no EC2 management)
- **EC2**: You manage the instances

### ECR (Elastic Container Registry)

Docker image registry.

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t my-app .
docker tag my-app:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/my-app:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/my-app:latest
```

---

## Messaging and Events

### SQS (Simple Queue Service)

Managed message queue.

```javascript
import { SQSClient, SendMessageCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({ region: 'us-east-1' });

// Send message
await sqs.send(new SendMessageCommand({
  QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/my-queue',
  MessageBody: JSON.stringify({ orderId: '123', action: 'process' }),
  DelaySeconds: 0
}));

// Receive messages
const { Messages } = await sqs.send(new ReceiveMessageCommand({
  QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/my-queue',
  MaxNumberOfMessages: 10,
  WaitTimeSeconds: 20  // Long polling
}));
```

**Queue Types:**
- **Standard**: At-least-once delivery, best-effort ordering
- **FIFO**: Exactly-once, strict ordering (lower throughput)

### SNS (Simple Notification Service)

Pub/sub messaging.

```javascript
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const sns = new SNSClient({ region: 'us-east-1' });

await sns.send(new PublishCommand({
  TopicArn: 'arn:aws:sns:us-east-1:123456789:my-topic',
  Message: JSON.stringify({ event: 'user.created', userId: '123' }),
  Subject: 'New User'
}));
```

**Subscribers:** Lambda, SQS, HTTP/S, Email, SMS

### EventBridge

Serverless event bus.

```javascript
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const eventBridge = new EventBridgeClient({ region: 'us-east-1' });

await eventBridge.send(new PutEventsCommand({
  Entries: [
    {
      Source: 'my-app',
      DetailType: 'Order Created',
      Detail: JSON.stringify({ orderId: '123', amount: 99.99 }),
      EventBusName: 'default'
    }
  ]
}));
```

---

## Monitoring

### CloudWatch

Metrics, logs, and alarms.

```javascript
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatchClient({ region: 'us-east-1' });

// Custom metric
await cloudwatch.send(new PutMetricDataCommand({
  Namespace: 'MyApp',
  MetricData: [
    {
      MetricName: 'OrdersProcessed',
      Value: 1,
      Unit: 'Count',
      Dimensions: [
        { Name: 'Environment', Value: 'production' }
      ]
    }
  ]
}));
```

**Components:**
- **Metrics**: Time-series data
- **Logs**: Log storage and analysis
- **Alarms**: Trigger actions on thresholds
- **Dashboards**: Visualization

---

## Common Architectures

### Three-Tier Web Application

```
Users
  │
  ▼
Route 53 (DNS)
  │
  ▼
CloudFront (CDN)
  │
  ├── S3 (Static assets)
  │
  ▼
ALB (Load Balancer)
  │
  ▼
ECS/EC2 (Application Tier)
  │
  ▼
RDS (Database) + ElastiCache (Redis)
```

### Serverless API

```
Users
  │
  ▼
API Gateway
  │
  ▼
Lambda Functions
  │
  ├── DynamoDB (Data)
  ├── S3 (Files)
  └── SQS (Async processing)
```

### Event-Driven Architecture

```
S3 Upload → Lambda → SQS → Lambda → DynamoDB
                       ↓
                     SNS → Email notification
```

---

## Interview Questions

**Q: What is AWS and why use it?**

A: AWS is Amazon's cloud platform offering 200+ services for computing, storage, databases, etc. Benefits: no upfront hardware costs, pay-as-you-go pricing, global infrastructure, scalability (scale up/down in minutes), high availability (multi-AZ), managed services reduce ops burden, and extensive ecosystem.

**Q: Explain the difference between EC2 and Lambda.**

A: EC2 provides virtual servers you manage—choose instance type, OS, configure scaling, pay by the hour even when idle. Lambda is serverless—upload code, it runs on demand, scales automatically, pay only for execution time (per 100ms). Use EC2 for long-running processes, specific OS needs, or predictable workloads. Use Lambda for event-driven, sporadic, or variable workloads.

**Q: What's the difference between S3 storage classes?**

A: Standard for frequently accessed data. Intelligent-Tiering auto-moves based on access patterns. Standard-IA for infrequent access (cheaper storage, retrieval fee). One Zone-IA same but single AZ. Glacier for archival with minutes to hours retrieval. Glacier Deep Archive for rarely accessed archives. Choose based on access frequency and retrieval time requirements.

**Q: How would you design for high availability?**

A: Deploy across multiple AZs (at least 2). Use Auto Scaling to replace failed instances. Put load balancer in front (ALB distributes traffic). Use RDS Multi-AZ for database failover. Store static assets in S3 (11 9's durability). Use Route 53 health checks for DNS failover. Cache with ElastiCache to reduce database load. Design for graceful degradation.

**Q: Explain IAM roles vs users.**

A: Users are permanent identities for people with long-term credentials (password, access keys). Roles are temporary identities assumed by services, applications, or users. EC2 instances, Lambda functions, and ECS tasks should use roles, not access keys. Roles provide temporary credentials that auto-rotate. Cross-account access also uses roles.

**Q: How does VPC networking work?**

A: VPC is your isolated network. Define CIDR block (e.g., 10.0.0.0/16). Create subnets in AZs—public subnets have route to Internet Gateway, private subnets route through NAT Gateway. Security Groups are stateful firewalls at instance level. Network ACLs are stateless at subnet level. Route tables control traffic flow between subnets and to internet.

---

## Practice Project

Build a serverless application on AWS:

**Requirements:**
1. REST API with API Gateway + Lambda
2. DynamoDB for data storage
3. S3 for file uploads with presigned URLs
4. Cognito for authentication
5. SQS for async processing
6. CloudWatch for logging and metrics
7. Infrastructure as Code (CDK or Terraform)
8. CI/CD with CodePipeline or GitHub Actions

---

## Resources

- https://aws.amazon.com/documentation/ (Official docs)
- https://aws.amazon.com/training/ (Free training)
- https://explore.skillbuilder.aws/ (Skill Builder)
- https://www.youtube.com/c/amazonwebservices (AWS YouTube)
