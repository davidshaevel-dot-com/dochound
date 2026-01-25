# System Design Interview Guide

**Purpose:** Technical interview preparation for Principal/Senior level roles
**Last Updated:** January 20, 2026

---

## System Design Framework (RESHADE)

Use this framework to structure your approach:

```
R - Requirements (functional & non-functional)
E - Estimation (scale, traffic, storage)
S - Storage (database choices)
H - High-level design (architecture diagram)
A - API design (endpoints, contracts)
D - Deep dive (specific components)
E - Evaluate (trade-offs, bottlenecks)
```

---

## Step 1: Requirements Gathering (3-5 minutes)

### Functional Requirements

Ask clarifying questions:
- Who are the users?
- What are the core features?
- What actions can users perform?
- What data needs to be stored?

### Non-Functional Requirements

- **Scale:** How many users? DAU/MAU?
- **Latency:** Expected response times?
- **Availability:** 99.9%? 99.99%?
- **Consistency:** Strong vs eventual?
- **Durability:** Data loss tolerance?

### Example: Design a Document Search System (Like Circuit)

```
Functional:
- Users can upload documents (PDFs, manuals, etc.)
- Users can search documents by keyword or semantic meaning
- Users can ask questions and get AI-generated answers
- Results should cite sources

Non-Functional:
- 10,000 documents initially, growing to 1M
- Search latency < 500ms
- 99.9% availability
- Support 1000 concurrent users
```

---

## Step 2: Estimation (2-3 minutes)

### Traffic Estimation

```
Users: 10,000 DAU
Actions per user: 10 searches/day
Total searches: 100,000/day
QPS: 100,000 / 86,400 ≈ 1.2 QPS (average)
Peak QPS: 10x = 12 QPS
```

### Storage Estimation

```
Documents: 1M documents
Average size: 1MB (text extracted)
Total storage: 1TB raw documents
Embeddings: 1M × 1536 dimensions × 4 bytes = 6GB vectors
Metadata: ~100 bytes/doc = 100MB
Total: ~1.1TB
```

### Bandwidth

```
Search request: ~1KB
Search response: ~10KB (with snippets)
Uploads: 1MB average
Daily upload traffic: 100 docs/day × 1MB = 100MB
```

---

## Step 3: High-Level Architecture

### Basic Web Application

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   CDN/LB    │────▶│  Web Servers│
│  (Browser)  │     │             │     │  (Stateless)│
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
              ┌─────▼─────┐            ┌───────▼───────┐          ┌───────▼───────┐
              │   Cache   │            │    Database   │          │  File Storage │
              │  (Redis)  │            │ (PostgreSQL)  │          │     (S3)      │
              └───────────┘            └───────────────┘          └───────────────┘
```

### AI-Powered Search System

```
                                    ┌─────────────────┐
                                    │   API Gateway   │
                                    └────────┬────────┘
                                             │
              ┌──────────────────────────────┼─────────────────────────────┐
              │                              │                             │
    ┌─────────▼─────────┐         ┌──────────▼──────────┐        ┌─────────▼─────────┐
    │  Upload Service   │         │   Search Service    │        │   Query Service   │
    │                   │         │                     │        │   (AI/RAG)        │
    └─────────┬─────────┘         └──────────┬──────────┘        └─────────┬─────────┘
              │                              │                             │
    ┌─────────▼─────────┐         ┌──────────▼──────────┐        ┌─────────▼─────────┐
    │  Document Queue   │         │   Vector Database   │        │    LLM Service    │
    │     (SQS)         │         │    (Pinecone)       │        │   (Bedrock/GPT)   │
    └─────────┬─────────┘         └───────────────────┬─┘        └───────────────────┘
              │                                       │
    ┌─────────▼─────────┐                   ┌─────────▼─────────┐
    │ Processing Worker │                   │   Elasticsearch   │
    │  - Extract text   │                   │  (Full-text)      │
    │  - Chunk          │                   └───────────────────┘
    │  - Embed          │
    └─────────┬─────────┘
              │
    ┌─────────▼─────────┐
    │   Object Storage  │
    │       (S3)        │
    └───────────────────┘
```

---

## Step 4: API Design

### RESTful Endpoints

```yaml
# Document Management
POST /api/v1/documents
  - Upload new document
  - Returns: document_id, status

GET /api/v1/documents/{id}
  - Get document metadata
  - Returns: document details

DELETE /api/v1/documents/{id}
  - Delete document

# Search
POST /api/v1/search
  Body: { query: string, filters: object, limit: number }
  Returns: { results: Document[], total: number }

# AI Query
POST /api/v1/query
  Body: { question: string, document_ids?: string[] }
  Returns: { answer: string, sources: Source[] }
```

### Request/Response Examples

```json
// Search Request
POST /api/v1/search
{
  "query": "hydraulic system maintenance",
  "filters": {
    "category": "maintenance",
    "documentType": "manual"
  },
  "limit": 20,
  "offset": 0
}

// Search Response
{
  "results": [
    {
      "id": "doc-123",
      "title": "Hydraulic System Manual",
      "snippet": "...regular maintenance of the hydraulic system...",
      "score": 0.95,
      "source": "manufacturer-manuals/hydraulic-v2.pdf"
    }
  ],
  "total": 156,
  "took_ms": 45
}
```

---

## Step 5: Database Design

### Relational Schema (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(50),
    size_bytes BIGINT,
    status VARCHAR(50) DEFAULT 'processing',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Document Chunks (for RAG)
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding_id VARCHAR(255),  -- Reference to vector DB
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Search History
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    query TEXT NOT NULL,
    filters JSONB,
    results_count INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_search_user ON search_history(user_id);
```

### NoSQL Schema (DynamoDB)

```javascript
// Single-table design
// PK = Partition Key, SK = Sort Key

// User item
{
  PK: "USER#user-123",
  SK: "PROFILE",
  email: "user@example.com",
  name: "John Doe",
  createdAt: "2024-01-15T00:00:00Z"
}

// Document item
{
  PK: "USER#user-123",
  SK: "DOC#doc-456",
  GSI1PK: "DOC#doc-456",
  GSI1SK: "METADATA",
  title: "System Manual",
  status: "processed",
  fileType: "pdf",
  createdAt: "2024-01-15T00:00:00Z"
}

// Access patterns:
// 1. Get user's documents: Query PK="USER#xxx", SK begins_with "DOC#"
// 2. Get document by ID: Query GSI1PK="DOC#xxx"
```

---

## Step 6: Deep Dive Components

### Document Processing Pipeline

```
Upload Request
      │
      ▼
┌─────────────────┐
│ Validation      │ ← Check file type, size, permissions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Store Raw File  │ ← S3: documents/{user_id}/{doc_id}/original
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Queue for       │ ← SQS: document-processing-queue
│ Processing      │
└────────┬────────┘
         │
         ▼ (Async Worker)
┌─────────────────┐
│ Extract Text    │ ← PDF: pdfjs, images: Tesseract OCR
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Chunk Text      │ ← Recursive splitting, 1000 chars, 200 overlap
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate        │ ← OpenAI/Bedrock embeddings API
│ Embeddings      │   Batch process chunks
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Store Vectors   │ ← Pinecone: upsert with metadata
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Index Full-text │ ← Elasticsearch: for keyword search
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Status   │ ← Database: status = "processed"
└─────────────────┘
```

### Search Architecture

```
Search Query
      │
      ▼
┌─────────────────┐
│ Query Analysis  │ ← Determine: keyword vs semantic
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────────┐
│Keyword│ │ Semantic  │
│Search │ │  Search   │
│(ES)   │ │(Pinecone) │
└───┬───┘ └─────┬─────┘
    │           │
    └─────┬─────┘
          │
          ▼
┌─────────────────┐
│ Merge & Rank    │ ← Hybrid scoring, deduplication
│ Results         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Apply Filters   │ ← Category, date range, permissions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Format Response │ ← Add snippets, highlights
└─────────────────┘
```

---

## Step 7: Scalability & Reliability

### Horizontal Scaling

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐    ┌───────▼───────┐    ┌───────▼───────┐
│   Server 1    │    │   Server 2    │    │   Server 3    │
│  (Stateless)  │    │  (Stateless)  │    │  (Stateless)  │
└───────────────┘    └───────────────┘    └───────────────┘

Key Principles:
- Stateless services (no session state on server)
- Session data in Redis/DynamoDB
- Auto-scaling based on CPU/memory/requests
- Health checks and automatic replacement
```

### Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      Cache Layers                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  L1: Browser Cache (static assets, API responses)           │
│       TTL: 1 hour for static, 5 min for API                 │
│                                                             │
│  L2: CDN (CloudFront/Cloudflare)                            │
│       Static assets, geographic distribution                │
│                                                             │
│  L3: Application Cache (Redis)                              │
│       - Search results (TTL: 5 min)                         │
│       - User sessions (TTL: 24 hours)                       │
│       - Document metadata (TTL: 1 hour)                     │
│                                                             │
│  L4: Database Query Cache                                   │
│       PostgreSQL query cache, materialized views            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Reliability Patterns

```javascript
// Circuit Breaker
class CircuitBreaker {
  constructor(threshold = 5, timeout = 30000) {
    this.failures = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED';  // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = 0;
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}

// Retry with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## Common System Design Questions

### 1. Design a URL Shortener

```
Requirements:
- Shorten URLs
- Redirect short URLs
- Analytics (click count)

Scale:
- 100M URLs created/month
- 10:1 read/write ratio

Storage:
- URL mapping: hash → original URL
- Analytics: click events

Key decisions:
- Hash algorithm: Base62 encoding of auto-increment ID
- Database: SQL for URL mapping, time-series for analytics
- Caching: Redis for hot URLs
```

### 2. Design a Rate Limiter

```
Algorithms:
1. Token Bucket - Smooth traffic, allows bursts
2. Sliding Window - Fixed window count
3. Leaky Bucket - Constant rate output

Implementation:
- Redis for distributed counting
- Key: user_id:endpoint:window
- Sliding window: sorted set with timestamps
```

### 3. Design a Notification System

```
Components:
- Event ingestion (Kafka/SQS)
- User preferences store
- Channel handlers (email, push, SMS)
- Delivery tracking

Challenges:
- Exactly-once delivery
- Ordering guarantees
- Rate limiting per user
```

---

## Trade-offs to Discuss

### SQL vs NoSQL

| Factor | SQL | NoSQL |
|--------|-----|-------|
| Schema | Rigid, structured | Flexible, schemaless |
| Scaling | Vertical (mostly) | Horizontal |
| ACID | Full support | Varies (eventual consistency) |
| Joins | Native | Application-level |
| Use case | Complex queries, relationships | Simple queries, scale |

### Monolith vs Microservices

| Factor | Monolith | Microservices |
|--------|----------|---------------|
| Complexity | Lower initially | Higher |
| Deployment | Single unit | Independent |
| Scaling | All or nothing | Selective |
| Team size | Small teams | Large organizations |
| Debugging | Easier | Distributed tracing needed |

### Sync vs Async Processing

| Factor | Synchronous | Asynchronous |
|--------|-------------|--------------|
| User experience | Immediate feedback | Eventual |
| Reliability | Coupled to downstream | Decoupled |
| Complexity | Simpler | Queues, workers |
| Use case | Real-time needs | Background tasks |

---

## Your Experience Talking Points

### Walmart Developer Platforms

> "At Walmart, I designed and built the Team Productivity Dashboard that aggregated metrics from multiple sources - GitHub, CI/CD systems, deployment platforms. The architecture used React frontend with Elasticsearch backend, handling metrics from 1900+ users across 200+ projects. I had to consider caching strategies for expensive aggregations and real-time updates for the status monitoring components."

### Zello Multi-Cloud Infrastructure

> "At Zello, I managed infrastructure across IBM Cloud, AWS, and GCP with disaster recovery between regions. This gave me hands-on experience with distributed systems - managing consistency across data centers, handling failover, and designing for reliability. I implemented monitoring with Grafana and Telegraf that maintained 99.9% uptime."

### MCP Server Architecture

> "The MCP server I built at Zello's hackathon was a good example of service design. It needed to support both stdio for Claude integration and HTTP REST endpoints for other clients. I designed it with clear separation of concerns - transport layer, tool handlers, and data access layer for Elasticsearch and WebSocket APIs."
