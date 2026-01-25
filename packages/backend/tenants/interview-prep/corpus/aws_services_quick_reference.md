# AWS Services Quick Reference

**Purpose:** Technical interview preparation for Emporia Research and Autonomize AI
**Last Updated:** January 20, 2026

---

## Services Used at Emporia Research

| Service | Category | Purpose |
|---------|----------|---------|
| DynamoDB | Database | NoSQL document/key-value store |
| Cognito | Auth | User authentication and identity |
| Amplify | Platform | Full-stack app development |
| Lambda | Compute | Serverless functions |
| OpenSearch | Search | Full-text search (Elasticsearch fork) |
| StepFunctions | Orchestration | Workflow automation |
| S3 | Storage | Object storage |
| CDK | IaC | Infrastructure as Code |
| Glue | ETL | Data integration/transformation |
| Bedrock | AI | Foundation models (LLMs) |

---

## DynamoDB

### Core Concepts

```
Table
├── Partition Key (required) - determines data distribution
├── Sort Key (optional) - enables range queries
├── Attributes - flexible schema per item
└── Indexes
    ├── Local Secondary Index (LSI) - same partition key, different sort key
    └── Global Secondary Index (GSI) - different partition and/or sort key
```

### Data Modeling

```javascript
// Single-table design pattern
// PK = partition key, SK = sort key

// User item
{
  PK: "USER#123",
  SK: "PROFILE",
  name: "John Doe",
  email: "john@example.com"
}

// User's orders
{
  PK: "USER#123",
  SK: "ORDER#2024-01-15#456",
  total: 99.99,
  status: "shipped"
}

// Query all user data
const result = await dynamodb.query({
  TableName: 'MainTable',
  KeyConditionExpression: 'PK = :pk',
  ExpressionAttributeValues: { ':pk': 'USER#123' }
});
```

### Access Patterns

```javascript
// Get single item
await dynamodb.get({
  TableName: 'Users',
  Key: { userId: '123' }
});

// Query with sort key
await dynamodb.query({
  TableName: 'Orders',
  KeyConditionExpression: 'userId = :uid AND orderDate BETWEEN :start AND :end',
  ExpressionAttributeValues: {
    ':uid': '123',
    ':start': '2024-01-01',
    ':end': '2024-12-31'
  }
});

// Update item
await dynamodb.update({
  TableName: 'Users',
  Key: { userId: '123' },
  UpdateExpression: 'SET #name = :name, updatedAt = :now',
  ExpressionAttributeNames: { '#name': 'name' },
  ExpressionAttributeValues: { ':name': 'New Name', ':now': Date.now() }
});

// Conditional write
await dynamodb.put({
  TableName: 'Users',
  Item: { userId: '123', email: 'new@email.com' },
  ConditionExpression: 'attribute_not_exists(userId)'
});
```

### Capacity & Pricing

- **On-Demand:** Pay per request, auto-scaling
- **Provisioned:** Set read/write capacity units (RCU/WCU)
- 1 RCU = 1 strongly consistent read (4KB) or 2 eventually consistent reads
- 1 WCU = 1 write (1KB)

---

## Lambda

### Function Structure

```javascript
// Handler
export const handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event));

  try {
    const result = await processEvent(event);
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

### Event Sources

```javascript
// API Gateway event
{
  httpMethod: 'POST',
  path: '/users',
  headers: { ... },
  body: '{"name": "John"}',
  queryStringParameters: { ... },
  pathParameters: { id: '123' }
}

// S3 event
{
  Records: [{
    s3: {
      bucket: { name: 'my-bucket' },
      object: { key: 'uploads/file.txt' }
    }
  }]
}

// DynamoDB Streams event
{
  Records: [{
    eventName: 'INSERT',
    dynamodb: {
      NewImage: { ... },
      OldImage: { ... }
    }
  }]
}

// SQS event
{
  Records: [{
    body: '{"message": "hello"}',
    messageId: '...',
    receiptHandle: '...'
  }]
}
```

### Best Practices

- Keep functions small and focused
- Use environment variables for configuration
- Initialize SDK clients outside handler (reuse across invocations)
- Use Lambda layers for shared code
- Set appropriate timeout and memory

```javascript
// Good: SDK client outside handler
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
const client = new DynamoDBClient({});

export const handler = async (event) => {
  // client is reused across warm invocations
};
```

---

## Cognito

### User Pools vs Identity Pools

| User Pools | Identity Pools |
|------------|----------------|
| User directory | Federated identities |
| Sign-up/sign-in | AWS credentials |
| JWT tokens | Temporary IAM credentials |
| MFA, password policies | Access AWS services directly |

### Authentication Flow

```javascript
// Sign up
await cognito.signUp({
  ClientId: 'xxx',
  Username: 'user@email.com',
  Password: 'password123',
  UserAttributes: [{ Name: 'email', Value: 'user@email.com' }]
});

// Confirm sign up
await cognito.confirmSignUp({
  ClientId: 'xxx',
  Username: 'user@email.com',
  ConfirmationCode: '123456'
});

// Sign in
const result = await cognito.initiateAuth({
  AuthFlow: 'USER_PASSWORD_AUTH',
  ClientId: 'xxx',
  AuthParameters: {
    USERNAME: 'user@email.com',
    PASSWORD: 'password123'
  }
});
// Returns: AccessToken, IdToken, RefreshToken

// Refresh tokens
await cognito.initiateAuth({
  AuthFlow: 'REFRESH_TOKEN_AUTH',
  ClientId: 'xxx',
  AuthParameters: {
    REFRESH_TOKEN: refreshToken
  }
});
```

### JWT Token Structure

```javascript
// IdToken payload
{
  sub: 'user-uuid',
  email: 'user@email.com',
  email_verified: true,
  'cognito:username': 'user@email.com',
  'custom:role': 'admin',  // Custom attribute
  iss: 'https://cognito-idp.region.amazonaws.com/poolId',
  exp: 1234567890
}
```

---

## S3

### Common Operations

```javascript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({});

// Upload
await s3.send(new PutObjectCommand({
  Bucket: 'my-bucket',
  Key: 'uploads/file.txt',
  Body: Buffer.from('content'),
  ContentType: 'text/plain'
}));

// Download
const response = await s3.send(new GetObjectCommand({
  Bucket: 'my-bucket',
  Key: 'uploads/file.txt'
}));
const content = await response.Body.transformToString();

// Generate presigned URL (for client-side upload/download)
const url = await getSignedUrl(s3, new PutObjectCommand({
  Bucket: 'my-bucket',
  Key: 'uploads/user-file.txt'
}), { expiresIn: 3600 });  // 1 hour
```

### Storage Classes

| Class | Use Case | Retrieval |
|-------|----------|-----------|
| Standard | Frequently accessed | Immediate |
| Standard-IA | Infrequent access | Immediate |
| One Zone-IA | Non-critical, infrequent | Immediate |
| Glacier | Archive | Minutes to hours |
| Glacier Deep Archive | Long-term archive | 12-48 hours |

---

## Step Functions

### State Machine Definition

```json
{
  "Comment": "Process order workflow",
  "StartAt": "ValidateOrder",
  "States": {
    "ValidateOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:region:account:function:validateOrder",
      "Next": "CheckInventory",
      "Catch": [{
        "ErrorEquals": ["ValidationError"],
        "Next": "OrderFailed"
      }]
    },
    "CheckInventory": {
      "Type": "Choice",
      "Choices": [{
        "Variable": "$.inStock",
        "BooleanEquals": true,
        "Next": "ProcessPayment"
      }],
      "Default": "OutOfStock"
    },
    "ProcessPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:region:account:function:processPayment",
      "Next": "ShipOrder"
    },
    "ShipOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:region:account:function:shipOrder",
      "End": true
    },
    "OutOfStock": {
      "Type": "Fail",
      "Error": "OutOfStock",
      "Cause": "Item is out of stock"
    },
    "OrderFailed": {
      "Type": "Fail",
      "Error": "ValidationError"
    }
  }
}
```

### State Types

| Type | Purpose |
|------|---------|
| Task | Execute work (Lambda, API, etc.) |
| Choice | Branching logic |
| Parallel | Execute branches in parallel |
| Wait | Delay execution |
| Map | Iterate over array |
| Pass | Pass input to output |
| Succeed | Successful termination |
| Fail | Failed termination |

---

## AWS CDK (Cloud Development Kit)

### Basic Stack

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class MyStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB table
    const table = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda function
    const fn = new lambda.Function(this, 'MyFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    // Grant permissions
    table.grantReadWriteData(fn);

    // API Gateway
    const api = new apigateway.RestApi(this, 'MyApi', {
      restApiName: 'My Service',
    });

    const users = api.root.addResource('users');
    users.addMethod('GET', new apigateway.LambdaIntegration(fn));
    users.addMethod('POST', new apigateway.LambdaIntegration(fn));
  }
}
```

### CDK Commands

```bash
# Initialize new project
cdk init app --language typescript

# Synthesize CloudFormation template
cdk synth

# Deploy stack
cdk deploy

# Compare deployed vs local
cdk diff

# Destroy stack
cdk destroy
```

---

## Bedrock (AI Foundation Models)

### Invoke Model

```javascript
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({});

// Claude model
const response = await client.send(new InvokeModelCommand({
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  contentType: 'application/json',
  accept: 'application/json',
  body: JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: 'Explain quantum computing in simple terms.' }
    ]
  })
}));

const result = JSON.parse(new TextDecoder().decode(response.body));
console.log(result.content[0].text);
```

### Available Models

| Provider | Model | Use Case |
|----------|-------|----------|
| Anthropic | Claude 3 | General purpose, analysis |
| Amazon | Titan | Embeddings, text generation |
| Meta | Llama 2 | Open source, customizable |
| Cohere | Command | Business applications |
| Stability AI | Stable Diffusion | Image generation |

---

## OpenSearch (Elasticsearch Fork)

### Index Operations

```javascript
import { Client } from '@opensearch-project/opensearch';

const client = new Client({
  node: 'https://search-domain.region.es.amazonaws.com',
});

// Create index
await client.indices.create({
  index: 'products',
  body: {
    mappings: {
      properties: {
        name: { type: 'text' },
        description: { type: 'text' },
        price: { type: 'float' },
        category: { type: 'keyword' },
        embedding: { type: 'knn_vector', dimension: 768 }
      }
    }
  }
});

// Index document
await client.index({
  index: 'products',
  id: '1',
  body: {
    name: 'Laptop',
    description: 'High performance laptop',
    price: 999.99,
    category: 'electronics'
  }
});

// Search
const result = await client.search({
  index: 'products',
  body: {
    query: {
      bool: {
        must: [
          { match: { description: 'performance' } }
        ],
        filter: [
          { range: { price: { lte: 1000 } } }
        ]
      }
    }
  }
});
```

### Vector Search (KNN)

```javascript
// Semantic search using embeddings
const result = await client.search({
  index: 'products',
  body: {
    size: 10,
    query: {
      knn: {
        embedding: {
          vector: [0.1, 0.2, ...],  // Query embedding
          k: 10
        }
      }
    }
  }
});
```

---

## Glue (ETL)

### Glue Job (PySpark)

```python
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

args = getResolvedOptions(sys.argv, ['JOB_NAME'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Read from catalog
datasource = glueContext.create_dynamic_frame.from_catalog(
    database="my_database",
    table_name="raw_data"
)

# Transform
transformed = ApplyMapping.apply(
    frame=datasource,
    mappings=[
        ("old_name", "string", "new_name", "string"),
        ("value", "long", "value", "long")
    ]
)

# Write to S3
glueContext.write_dynamic_frame.from_options(
    frame=transformed,
    connection_type="s3",
    connection_options={"path": "s3://bucket/output/"},
    format="parquet"
)

job.commit()
```

---

## Your Experience Talking Points

### Zello Multi-Cloud Infrastructure

> "At Zello, I managed infrastructure across IBM Cloud, AWS, and GCP. I used Terraform extensively for infrastructure as code - provisioning VPCs, security groups, load balancers, and container orchestration. For AWS specifically, I worked with ECR for container registry, and set up CI/CD pipelines using GitHub Actions that deployed to multiple cloud environments."

### Walmart Azure DevOps

> "While my primary cloud experience at Walmart was Azure, the concepts transfer directly to AWS. I managed Azure DevOps for 1900+ users with 1800+ build pipelines - the CI/CD patterns, infrastructure automation with Terraform, and containerization with Docker are the same. I've also worked with GCP at Zello for our migration project."

### Serverless Architecture

> "I'm experienced with serverless patterns. At Zello, I worked with Lambda-equivalent services for background processing. The MCP server I built at the hackathon used similar patterns - stateless handlers that process events and interact with data stores. I understand cold starts, function sizing, and the event-driven architecture that makes serverless effective."
