# Ella AI Assistant - Comprehensive Technical Specification

**System:** Zello Ella AI Assistant Microservice
**Language:** Go
**Purpose:** Production RAG-based AI assistant for frontline workers
**Last Updated:** January 24, 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Service Architecture](#2-service-architecture)
3. [Concurrency Model](#3-concurrency-model)
4. [Socket Protocol](#4-socket-protocol)
5. [RAG Pipeline](#5-rag-pipeline)
6. [Elasticsearch Integration](#6-elasticsearch-integration)
7. [Document Sync Pipeline](#7-document-sync-pipeline)
8. [Permission Model](#8-permission-model)
9. [Prompt Engineering](#9-prompt-engineering)
10. [Audio/Voice Pipeline](#10-audiovoice-pipeline)
11. [Chat Session Lifecycle](#11-chat-session-lifecycle)
12. [Error Handling & Graceful Degradation](#12-error-handling--graceful-degradation)
13. [Token Management](#13-token-management)
14. [Observability](#14-observability)
15. [Deployment Infrastructure](#15-deployment-infrastructure)
16. [Security](#16-security)

---

## 1. System Overview

Ella is a production AI assistant that provides frontline workers with instant, voice-and-text-based answers sourced from their company's knowledge base. The system implements Retrieval-Augmented Generation (RAG) to ensure all responses are grounded in authoritative documents rather than LLM hallucination.

### High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                        Zello Mobile Client                           │
│                    (Push-to-Talk / Text Input)                       │
└──────────────────────────┬────────────────────────────────────────────┘
                           │ LoudTalks Protocol (TCP)
                           ▼
┌───────────────────────────────────────────────────────────────────────┐
│                     Supernode (Relay Server)                          │
└──────────────────────────┬────────────────────────────────────────────┘
                           │ LoudTalks Protocol (TCP :8086)
                           ▼
┌───────────────────────────────────────────────────────────────────────┐
│                   AI Assistant Service (Go)                           │
│                                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────────┐   │
│  │ Socket Svc   │  │ Message      │  │ OpenAI Client              │   │
│  │ (TCP server) │→ │ Use Case     │→ │ (Two-stage function call)  │   │
│  └─────────────┘  └──────────────┘  └─────────────┬──────────────┘   │
│                                                     │                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────▼──────────────┐  │
│  │ Expiration   │  │ Sync         │  │ Elasticsearch Client        │  │
│  │ Service      │  │ Service      │  │ (ELSER-2 semantic search)   │  │
│  └─────────────┘  └──────────────┘  └─────────────────────────────┘  │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Prometheus Metrics (:9092)  │  Evaluation HTTP API (:8087)     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
         │                                          │
         ▼                                          ▼
┌─────────────────┐                    ┌────────────────────────┐
│ LLM Guard API   │                    │ Elasticsearch Cloud    │
│ (Prompt Guard)  │                    │ (3 indices)            │
│ :8000           │                    └────────────────────────┘
└─────────────────┘                                │
                                                   │ S3 Connector
                                                   ▼
                                       ┌────────────────────────┐
                                       │ AWS S3                 │
                                       │ (Document Storage)     │
                                       └────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Language | Go |
| LLM | OpenAI GPT-4.1-mini (`github.com/openai/openai-go v0.1.0-beta.10`) |
| Search | Elasticsearch v8 with ELSER-2 sparse embeddings |
| TTS | OpenAI TTS-1 (Shimmer voice, Opus codec) |
| Audio Codec | OGG/Opus streaming |
| Protocol | LoudTalks (custom text-header + binary-payload TCP protocol) |
| Document Storage | AWS S3 (via Elasticsearch S3 connector) |
| Prompt Security | LLM Guard API v0.3.16 |
| Metrics | Prometheus (`github.com/prometheus/client_golang`) |
| Observability | OpenTelemetry, Logrus structured logging |
| HTTP Framework | Gin (evaluation API only) |
| Deployment | Docker Compose, Ansible |
| Container Registry | AWS ECR |

---

## 2. Service Architecture

### Package Structure

```
ai-assistant/
├── cmd/
│   ├── ai-assistant/main.go              # Service entry point
│   └── cli-utility/main.go               # CLI testing tool
├── internal/
│   ├── audio/                             # OGG/Opus packet processing
│   ├── commands/                          # Socket protocol command definitions
│   ├── config/                            # Configuration + Prometheus metrics
│   ├── constants/                         # Timeouts and buffer sizes
│   ├── dao/                               # Data access (in-memory chat repository)
│   ├── domain/                            # Domain models
│   │   ├── features/                      # User feature flags
│   │   ├── mode/                          # Chat modes (onboarding, etc.)
│   │   └── responsetype/                  # Text vs. audio response types
│   ├── infra/                             # External service clients
│   │   ├── elasticsearch/                 # Elasticsearch semantic search
│   │   └── openai/                        # OpenAI completion + TTS
│   ├── logging/                           # Structured logging with user context
│   ├── service/                           # Application services
│   │   ├── socket_service.go              # TCP socket server
│   │   ├── evaluation_service.go          # HTTP evaluation API
│   │   ├── sync_service.go               # Document sync from S3
│   │   └── expiration_service.go          # Chat session expiration
│   └── usecase/                           # Business logic orchestration
│       ├── message_usecase.go             # AI message processing
│       └── chat_usecase.go               # Chat session management
├── ai-assistant-service.json              # Runtime configuration
└── elastic-mappings.txt                   # Elasticsearch index schemas
```

### Layered Architecture

```
┌─────────────────────────────────────┐
│         Service Layer               │  socket_service, evaluation_service,
│  (Transport / Protocol Handling)    │  sync_service, expiration_service
├─────────────────────────────────────┤
│         Use Case Layer              │  message_usecase, chat_usecase
│  (Business Logic Orchestration)     │
├─────────────────────────────────────┤
│         Infrastructure Layer        │  openai client, elasticsearch client
│  (External Service Integration)     │
├─────────────────────────────────────┤
│         Domain Layer                │  Chat, ChatMessage, ChatContext,
│  (Core Models & Business Rules)     │  features, modes, response types
├─────────────────────────────────────┤
│         Data Access Layer           │  InMemoryChatRepository
│  (Storage Abstraction)              │
└─────────────────────────────────────┘
```

---

## 3. Concurrency Model

### Goroutine Architecture

The service manages three categories of goroutines:

**Category 1: Connection Goroutines**
- One listener goroutine accepts incoming supernode TCP connections
- Each accepted connection spawns two goroutines: a reader and a writer
- Read/write goroutines share a cancellable context for coordinated shutdown

```
Listener Goroutine
    │
    ├── Connection 1: ReadGoroutine + WriteGoroutine
    ├── Connection 2: ReadGoroutine + WriteGoroutine
    └── Connection N: ReadGoroutine + WriteGoroutine
```

**Category 2: Chat Processing Goroutines**
- One long-lived goroutine per active chat session
- Created lazily on first message from a user
- Exits when receiving a `CloseChatCommand` (user-initiated or expiration)

```
Chat Goroutine (per user session)
    │
    └── select loop on IncomingCommands channel
        ├── AIMessageCommand → processAIMessageCommand()
        └── CloseChatCommand → cleanup and exit
```

**Category 3: Background Service Goroutines**
- Expiration service: 1-minute ticker checking for inactive chats
- Sync service: polls for pending documents, orchestrates batch embedding

### Channel Architecture

| Channel | Type | Buffer | Purpose |
|---------|------|--------|---------|
| `SupernodeConnection.OutgoingCommands` | `chan commands.Command` | 20,000 | Responses queued for supernode |
| `Chat.IncomingCommands` | `chan commands.SocketCommand` | 10 | Commands queued for chat processing |
| `Chat.outgoingCommands` | `chan commands.Command` | Ref swap | Pointer to active connection's outgoing channel |

**Non-blocking send pattern:** Both incoming and outgoing channels use `select/default` to drop messages rather than block when buffers are full. Dropped messages are logged at WARN/ERROR level.

**Buffer sizing trade-off:** The large 20,000-item buffer for `OutgoingCommands` prioritizes preventing writer goroutine blocking over memory efficiency. This design choice:
- **Advantage:** Absorbs burst traffic without blocking the writer; audio streams generate many packets quickly
- **Trade-off:** Large buffers can mask backpressure issues; memory consumption scales with connection count
- **Mitigation:** Non-blocking sends with monitoring (dropped message metrics) provide visibility into buffer exhaustion

### Synchronization Primitives

| Primitive | Location | Protects |
|-----------|----------|----------|
| `sync.RWMutex` | `Chat` | `outgoingCommands` channel reference (swapped on reconnect) |
| `sync.RWMutex` | `InMemoryChatRepository` | Nested map `[network][username]*Chat` |
| `sync.Once` | `SupernodeConnection` | Prevents double-close on TCP connection |
| `context.WithTimeout` | Per AI message | 20-second timeout for complete message processing |
| `context.WithTimeout` | Per TTS request | 15-second timeout for audio generation |

### Connection Reconnection Handling

Mobile clients can failover between supernodes. When a user reconnects via a different supernode:

1. The existing chat session is found by `(network, username)` key
2. The `outgoingCommands` channel reference is atomically swapped to the new connection's channel (protected by RWMutex)
3. In-flight responses route to the new connection automatically
4. No chat history is lost (in-memory state persists)

---

## 4. Socket Protocol

### LoudTalks Wire Format

The service communicates with Zello supernodes using the LoudTalks protocol, a text-header + binary-payload format over persistent TCP connections.

**Envelope Structure:**
```
LT\n
ct:<content-type>\n
cl:<content-length>\n
nw:<network>\n
un:<username>\n
cid:<connection-id>\n
mid:<message-id>\n
pid:<packet-id>\n
\n
<payload>
```

- **Header delimiter:** Double newline (`\n\n`) separates header from payload
- **Content types:** `json` (commands) or `a` (audio binary data)
- **Content-length:** Exact byte length of payload, parsed for precise reading
- **Read block size:** 1,024 bytes per read operation

### Command Protocol

**Incoming Commands (from supernode):**

| Command | Parameters | Description |
|---------|-----------|-------------|
| `ai_message` | `network`, `username`, `text`, `response_type`, `mode`, `f` | Send message to AI |
| `get_chat` | `network`, `username` | Retrieve chat session info |
| `close_chat` | `network`, `username` | Close chat session |
| `keep_alive` | — | Connection heartbeat |

**Outgoing Commands (to supernode):**

| Command | Parameters | Description |
|---------|-----------|-------------|
| `text_message` | `network`, `username`, `text` | Text response |
| `message` | `network`, `username`, `codec`, `duration`, `message_id` | Audio message header |
| `end_message` | `network`, `username`, `message_id` | Audio stream complete |
| `transcription` | `network`, `username`, `text` | TTS transcription |
| `ai_message_error` | `network`, `username`, `error` | Error response |
| `chat_closed` | `network`, `username`, `reason` | Session terminated |

**Audio Packet Format:**
Audio data is sent as raw binary with `ct:a` content type. The protocol header carries `message_id` and `packet_id` for client-side reassembly and sequencing.

---

## 5. RAG Pipeline

### Two-Stage Function Calling Pattern

The OpenAI client implements a forced two-stage completion pattern that guarantees every response is grounded in retrieved documents.

```
                    Stage 1                              Stage 2
                    ───────                              ───────
User Message  ──►  OpenAI Call               Tool Results  ──►  OpenAI Call
+ System Prompt    (tool_choice: required)   + Full Context     (tool_choice: none)
+ Chat History     ──► tool_calls            ──► Final Answer   ──► Response to User
                       │
                       ▼
                   Elasticsearch
                   Semantic Search
                   (permission-filtered)
```

**Stage 1 - Forced Document Retrieval:**
- System prompt + chat history + current message sent to GPT-4.1-mini
- Tool definition: `retrieve_relevant_documents` with parameter `search_query` (string, required, English)
- `tool_choice` set to `"required"` - the model **must** call the tool
- Returns `tool_calls` array with extracted search queries

**Stage 2 - Grounded Answer Generation:**
- Original context + tool call results added as `ToolMessage`
- `tool_choice` set to `"none"` - no further tool calls allowed
- Model synthesizes final answer from retrieved documents
- Response returned to user as text or fed into TTS pipeline

### Why Forced Tool Calling?

Setting `tool_choice: "required"` is a deliberate architectural decision:
- **Prevents hallucination:** The model cannot generate answers from training data alone
- **Ensures grounding:** Every response traces back to a specific document
- **Safety-critical:** For frontline workers (safety procedures, hazmat protocols), accuracy is non-negotiable
- **Audit trail:** Search queries and retrieved documents are logged for debugging

---

## 6. Elasticsearch Integration

### Index Architecture

Three indices power the knowledge base:

**`document-embeddings`** - Primary search index
- Contains document chunks with `semantic_text` field
- ELSER-2 sparse embedding model generates vectors at index time
- Semantic search enabled via Elasticsearch's built-in inference pipeline

**`document-metadata`** - Document management
- Tracks document status (`pending`, `synced`, `failed`)
- Stores ownership and permission metadata
- Records timestamps for sync operations

**`document-sync`** - Sync state management
- Tracks S3 connector sync jobs
- Manages batch processing state
- Records sync completion timestamps

### Semantic Search Implementation

**Query Construction:**

The Elasticsearch client builds a boolean query combining semantic relevance with permission filters:

```
bool:
  must:
    - term: { network: <user's network> }         # Tenant isolation
    - semantic: { semantic_text: <search_query> }  # Semantic similarity
  filter:                                          # Filter context enforces access control
    - bool:
        should:
          - terms: { allowed_users: [<username>] }  # User permission
          - terms: { allowed_groups: [<groups>] }   # Group permission
          - bool:
              must_not:
                - exists: { field: allowed_users }  # Unrestricted docs
                - exists: { field: allowed_groups }
        minimum_should_match: 1                     # At least one permission condition must match
```

**Why `filter` context:** Permission checks use `filter` (not `should`) because:
1. `filter` enforces access control - unpermitted documents are excluded from results
2. `should` only affects scoring - unpermitted documents would still appear (just ranked lower)
3. `filter` clauses are cached by Elasticsearch for better performance

**Kiosk Mode Restriction:**
For kiosk users (feature flag `f=kiosk`), the query omits the unrestricted document fallback - only directly permission-matched documents are returned.

**Result Processing:**
- Maximum 5 results per query (configurable)
- Results include highlighted snippets from matching sections
- Total result text truncated to 2,500 tokens before inclusion in LLM context
- Search timeout: 5 seconds

### ELSER-2 Sparse Embeddings

ELSER-2 (Elastic Learned Sparse EncodeR) generates sparse vector representations:
- **Sparse vs. Dense:** ELSER-2 produces sparse vectors where most dimensions are zero, unlike dense embedding models (e.g., OpenAI `text-embedding-ada-002`)
- **Advantages:** Better at domain-specific vocabulary, more interpretable, no external API calls for embedding generation
- **Trade-off:** Elasticsearch-specific (not portable to other vector databases)
- **Inference:** Runs at index time (document ingestion) and query time (search request)

---

## 7. Document Sync Pipeline

### Pipeline Architecture

```
AWS S3 Bucket
    │
    │  Elasticsearch S3 Connector
    ▼
┌─────────────────────────────────────┐
│ Sync Service (Background Goroutine) │
│                                     │
│  1. Poll metadata index for         │
│     "pending" status documents      │
│                                     │
│  2. Configure S3 connector          │
│     filtering rules per batch       │
│                                     │
│  3. Trigger reindex job             │
│                                     │
│  4. Monitor job completion          │
│                                     │
│  5. Update metadata status          │
│     (pending → synced/failed)       │
│                                     │
│  6. Record metrics                  │
└─────────────────────────────────────┘
    │
    ▼
document-embeddings index
(ELSER-2 generates sparse vectors)
```

### Sync Phases (Instrumented)

| Phase | Description | Metric Label |
|-------|-------------|-------------|
| `load` | Query metadata index for pending documents | `documents_sync_times{phase="load"}` |
| `rules` | Configure S3 connector filtering rules | `documents_sync_times{phase="rules"}` |
| `job` | Trigger and wait for reindex job | `documents_sync_times{phase="job"}` |
| `reindex` | Elasticsearch processes and embeds documents | `documents_sync_times{phase="reindex"}` |
| `update` | Update metadata status records | `documents_sync_times{phase="update"}` |

### Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `document_sync_enabled` | `true` | Enable/disable sync service |
| `document_sync_max_batch_size` | `10` | Documents per sync batch |
| `s3_document_bucket` | (required) | S3 bucket containing source documents |
| `elastic_s3_connector_id` | (required) | Elasticsearch connector configuration ID |

---

## 8. Permission Model

### Multi-Tenant Isolation

The system implements three layers of access control:

**Layer 1: Network Isolation (Tenant-Level)**
- Every document and chat session is scoped to a `network` (tenant identifier)
- Elasticsearch queries always include `term: { network: <network> }` as a required filter
- Chat sessions keyed by `[network][username]` - cross-network access is structurally impossible

**Layer 2: User/Group Permissions (Document-Level)**
- Documents can specify `allowed_users` (keyword array) for individual access
- Documents can specify `allowed_groups` (keyword array) for group-based access
- Documents with neither field are considered unrestricted within their network

**Layer 3: Feature-Based Restrictions**
- **Kiosk mode** (`f=kiosk`): Only returns documents explicitly permissioned for the user; unrestricted documents are excluded
- **Standard mode**: Returns both explicitly permissioned documents and unrestricted documents

### Access Control Flow

```
Search Request
    │
    ├── Network filter (always applied)
    │
    ├── Standard user:
    │   └── Docs where:
    │       allowed_users includes username
    │       OR allowed_groups includes user's groups
    │       OR document has no access restrictions
    │
    └── Kiosk user:
        └── Docs where:
            allowed_users includes username
            OR allowed_groups includes user's groups
            (unrestricted docs excluded)
```

---

## 9. Prompt Engineering

### Three System Prompt Modes

**Default Mode** (production frontline assistant):
```
Role: "Ella" - specialized AI assistant for frontline workers
Behavior:
  - Answer questions using ONLY the knowledge database
  - Responses limited to 1-3 sentences maximum
  - If knowledge base doesn't contain the answer, say so
  - Output placeholder %output% replaced with response type context
    ("audio will be listened to" vs "text will be read")
```

**Onboarding Mode** (trial/demo users):
```
Role: Strict demo assistant
Behavior:
  - Only answer from provided document content
  - Deflect off-topic questions
  - Suggest contacting support for unsupported queries
  - Handle greetings and test messages gracefully
Network: Dedicated "aionboarding" network with separate document set
```

**Kiosk Mode** (retail store assistant):
```
Role: Ultra-concise retail assistant
Behavior:
  - Single sentence answers only
  - No source attribution
  - Escalate to store associate when uncertain
  - Extremely brief responses optimized for screen display
```

### Prompt Selection Logic

The system selects a prompt based on:
1. `mode` parameter in the incoming command (`ai_onboarding` → onboarding prompt)
2. User feature flags (`f=kiosk` → kiosk prompt)
3. Default prompt for all other cases

### Response Type Adaptation

The `%output%` placeholder in prompts is replaced dynamically:
- **Audio response:** "Your response as audio will be listened to by the user"
- **Text response:** "Your response as text will be read by the user"

This subtle instruction helps the LLM adjust verbosity and formatting for the delivery medium.

---

## 10. Audio/Voice Pipeline

### Text-to-Speech Flow

```
AI Text Response
    │
    ▼
OpenAI TTS-1 API
(Model: tts-1, Voice: shimmer, Format: opus)
    │
    ▼
OGG/Opus Stream
    │
    ▼
┌──────────────────────────────────────┐
│ Audio Packet Processor               │
│                                      │
│  1. Parse OGG container              │
│  2. Extract Opus packets             │
│  3. Calculate audio duration          │
│  4. Assign message_id + packet_id    │
│  5. Stream to client via socket      │
└──────────────────────────────────────┘
    │
    ▼
Client receives:
  1. "message" command (header: codec, duration, message_id)
  2. Audio packets (binary, sequenced by packet_id)
  3. "end_message" command (signals stream complete)
  4. "transcription" command (text version for display)
```

### Audio Processing Details

- **Codec:** Opus (within OGG container)
- **TTS Model:** OpenAI TTS-1 with "shimmer" voice
- **Streaming:** Audio is streamed packet-by-packet as it arrives from OpenAI
- **First-packet latency:** Tracked via `TextToSpeechFirstPacketTimes` histogram
- **Timeout:** 15 seconds for TTS generation
- **Fallback:** If TTS fails at any point, the system falls back to text response

### Partial Failure Handling

If the audio stream fails partway through:
- If no Opus packets have been sent yet → fall back to text response
- If some packets have already been sent → send `end_message` and `transcription` to allow client to display text alongside partial audio

---

## 11. Chat Session Lifecycle

### State Machine

```
                  First Message
    [No Session] ──────────────► [Active]
                                    │
                                    │ Each message resets
                                    │ inactivity timer
                                    │
                                    ├── Inactivity timeout (600s)
                                    │   └──► [Expired] ──► CloseChatCommand ──► [Removed]
                                    │
                                    └── User sends close_chat
                                        └──► CloseChatCommand ──► [Removed]
```

### Session Creation (Lazy Initialization)

1. `AIMessageReceived()` checks `InMemoryChatRepository` for existing session by `(network, username)`
2. If no session exists:
   - Create `Chat` with new UUID, buffered `IncomingCommands` channel, empty message history
   - Store in repository (nested map: `[network][username] → *Chat`)
   - Spawn dedicated `messageProcessor` goroutine
3. Update `outgoingCommands` channel reference (handles reconnection)

### In-Memory Storage

```go
type InMemoryChatRepository struct {
    chats      map[string]map[string]*domain.Chat  // [network][username]
    chatsMutex sync.RWMutex
}
```

- **No persistence:** Chat state lives only in memory. Service restart = all sessions lost.
- **Design rationale:** Chats are ephemeral Q&A sessions, not long-lived conversations. Persistence adds complexity without user value.
- **Metrics:** `chats_size` (gauge) and `networks_size` (gauge) track active sessions.

### Message History

- Maximum **20 messages** retained per chat (FIFO eviction)
- Both user and assistant messages stored
- Used as context for subsequent OpenAI calls (bounded by token budget)
- Role types: `"user"` and `"assistant"`

### Expiration

- Background goroutine ticks every **60 seconds**
- Checks `chat.IsExpired()`: `time.Since(last_update) > inactiveExpirationSeconds`
- Default inactivity timeout: **600 seconds** (10 minutes)
- Expired chats receive `CloseChatCommand` with reason `ChatClosedReasonExpired`
- `messageProcessor` goroutine detects command, removes chat from repository, exits

---

## 12. Error Handling & Graceful Degradation

### Error Hierarchy

| Error Level | Behavior | User Impact |
|-------------|----------|-------------|
| TCP read error | Close connection, exit read goroutine | Client reconnects via different supernode |
| TCP write error | Close connection, exit write goroutine | Client reconnects |
| Handler error | Log error, continue processing loop | No user impact |
| Channel full (incoming) | Drop message, send error response | User retries |
| Channel full (outgoing) | Drop message, log error | Response lost, user retries |
| OpenAI API error | Send `ai_message_error` response | User sees error message |
| TTS failure (before audio) | Fall back to text response | User receives text instead of audio |
| TTS failure (mid-stream) | Send `end_message` + `transcription` | Partial audio + text fallback |
| Token limit exceeded | Reject message with error | User sends shorter message |
| Elasticsearch timeout | Empty results passed to Stage 2, LLM responds "I don't have that information" | User asked to rephrase or try again |

### Key Design Decisions

1. **Non-blocking channel sends:** Never block on full channels. Drop messages and log rather than risk goroutine deadlock.
2. **sync.Once for connection closure:** Both read and write goroutines can trigger connection close. `sync.Once` prevents double-close panic.
3. **Context propagation:** Every AI message gets a 20-second `context.WithTimeout`. All downstream calls (OpenAI, Elasticsearch, TTS) respect this context for cancellation.
4. **Audio-to-text fallback:** TTS is treated as an enhancement. If it fails, the text response is always available as a fallback.
5. **RAG consistency on search failure:** Even if Elasticsearch times out, the two-stage RAG pattern is preserved. Stage 1 (forced tool call) still occurs; Stage 2 receives empty results. The system prompt instructs the LLM to respond with "I couldn't find that information" rather than hallucinating - maintaining the grounded response principle.

---

## 13. Token Management

### Budget Allocation

| Component | Token Limit | Purpose |
|-----------|-------------|---------|
| Chat history | 1,000 tokens | Previous conversation context (newest first) |
| Current message | 250 tokens | User's current input |
| Tool response | 2,500 tokens | Retrieved document content |
| System prompt | Unbounded | Prompt template (relatively small) |

### Token Estimation

The service uses a simple Go-based tokenization heuristic (not a true BPE tokenizer):
1. Replace punctuation with spaces
2. Split on whitespace
3. Count resulting tokens

This deliberately over-estimates token count (safer than under-estimating, which would exceed context windows).

### Truncation Behavior

- **Current message:** Rejected with error if exceeds 250 tokens
- **Chat history:** Newest messages included first, oldest dropped when budget exceeded
- **Tool response:** Silently truncated to 2,500 tokens with warning logged
- **System prompt:** Never truncated (assumed to fit within limits)

---

## 14. Observability

### Prometheus Metrics

**Gauges (current state):**

| Metric | Description |
|--------|-------------|
| `chats_size` | Active chat sessions |
| `networks_size` | Unique networks with active chats |
| `supernode_connections` | Active TCP connections |
| `documents_pending` | Documents awaiting sync |

**Counters (cumulative):**

| Metric | Description |
|--------|-------------|
| `ai_message_requests_total` | Total AI message requests |
| `ai_message_error_responses_total` | Total error responses |
| `token_usage_total{type=...}` | Token consumption by category |
| `documents_sync_total` | Documents successfully synced |

**Token Usage Labels:**
- `first_no_tool_request_input_tokens` - Stage 1 input
- `first_no_tool_request_output_tokens` - Stage 1 output
- `second_with_rag_request_input_tokens` - Stage 2 input
- `second_with_rag_request_output_tokens` - Stage 2 output
- `rag_character_count` - Retrieved document content size

**Histograms (latency distributions):**

| Metric | Bucket Range | Description |
|--------|-------------|-------------|
| `ai_message_audio_request_times_seconds` | 0.05s - 30s | End-to-end audio response time |
| `ai_message_text_request_times_seconds` | 0.05s - 20s | End-to-end text response time |
| `ai_message_audio_first_packet_times_seconds` | 0.05s - 30s | Time to first audio packet |
| `initial_query_request_times_seconds` | 0.05s - 20s | Stage 1 OpenAI latency |
| `document_search_request_times_seconds` | 0.05s - 20s | Elasticsearch query latency |
| `text_to_speech_request_times_seconds` | 0.05s - 30s | TTS total latency |
| `text_to_speech_first_packet_times_seconds` | 0.05s - 30s | TTS first packet latency |
| `opus_packet_creation_times_seconds` | 0.01s - 15s | Audio processing latency |
| `audio_length_times_seconds` | 0.5s - 300s | Generated audio duration |
| `response_character_counts` | 10 - 5000 | Response text length |
| `documents_sync_times_seconds{phase=...}` | 0.5s - 300s | Per-phase sync duration |
| `documents_pending_times_seconds` | 0.5s - 300s | Time documents spend pending |

### Structured Logging

- **Framework:** Logrus with structured fields
- **User context:** Helper functions `logging.InfoUser()`, `logging.WarnUser()`, `logging.ErrorUser()` automatically include `network` and `username` fields
- **Log rotation:** Docker JSON file driver, 10 files x 50MB = 500MB per container
- **Debug networks:** Configurable list of networks with verbose logging enabled

---

## 15. Deployment Infrastructure

### Container Architecture

**Docker Compose with two containers:**

| Container | Image | Purpose | Restart Policy |
|-----------|-------|---------|---------------|
| `ai-assistant-service` | `aws-ecr/zello/ai-assistant-service:0.2.0-803cf09` | Main Go service | `always` |
| `ai-prompt-guard` | `aws-ecr/zello/llm-guard-api:0.3.16` | Prompt injection protection | `unless-stopped` |

### Networking

| Port | Service | Binding |
|------|---------|---------|
| 8086/tcp | Socket server (supernode connections) | `primary_private_ipv4` |
| 8087/tcp | HTTP evaluation API | Internal |
| 9092/tcp | Prometheus metrics | `0.0.0.0` |
| 8000/tcp | LLM Guard API | Container-internal |

### Ansible Deployment

The service is deployed via an Ansible role that:

1. **Validates required secrets:** Fails fast if any mandatory credential is missing
2. **Renders configuration templates:**
   - `docker-compose.yml.j2` → Container orchestration
   - `ai-assistant.json.j2` → Service configuration (prompts, indices, timeouts)
   - `ai-assistant.env.j2` → Environment variables (API keys) with `0640` permissions
   - `scanners.yml.j2` → LLM Guard scanner configuration
3. **Pulls container images** from AWS ECR
4. **Starts/restarts containers** via Docker Compose v2
5. **Manages lifecycle** via handlers triggered by configuration changes

### Configuration Management

**Runtime configuration** (`ai-assistant.json`):
- System prompts for all three modes
- Elasticsearch index names and connection parameters
- Document search tool name and description
- Chat expiration timeouts
- Debug network list
- Summarization and suggested questions settings

**Environment variables** (`ai-assistant.env`):
- OpenAI API key
- Elasticsearch Cloud ID and API key
- Pipeline server endpoint
- S3 bucket and connector configuration
- Crowdin project ID and API token

### Environment Modes

```bash
# Production
./ai-assistant -x -e prod

# Development
./ai-assistant  # (no flags)
```

The `-x` flag and `-e prod` enable production-specific behaviors (log levels, GIN mode, etc.).

---

## 16. Security

### Prompt Injection Protection

**LLM Guard API** runs as a sidecar container, intercepting all prompts before they reach OpenAI:

**Input Scanners:**

| Scanner | Threshold | Strategy | Purpose |
|---------|-----------|----------|---------|
| `InvisibleText` | — | — | Detects hidden Unicode characters used in prompt injection |
| `PromptInjection` | 0.92 | `truncate_head_tail` | ML-based prompt injection detection |

**Configuration:**
- Fail-fast mode enabled: stops scanning on first detected violation
- Scan timeout: 30 seconds (both prompt and output)
- Output scanners: none configured (responses not scanned)

### Secrets Management

| Method | Usage |
|--------|-------|
| Ansible Vault | Encrypted variables in deployment playbooks |
| SOPS plugin | `community.sops.sops` for additional encryption |
| Environment variables | Runtime secrets injected via `.env` file |
| File permissions | `.env` file restricted to `0640` (root:root) |
| `no_log: true` | Sensitive Ansible tasks suppress output |

### Network Security

- Socket server binds to `primary_private_ipv4` (not public)
- Elasticsearch uses API key authentication over HTTPS (Elastic Cloud)
- OpenAI API key transmitted via HTTPS
- Container-to-container communication (LLM Guard) uses Docker internal networking

### Data Isolation

- Network-level tenant isolation enforced at every query
- Permission-scoped document access prevents cross-tenant data leakage
- Chat sessions keyed by `(network, username)` - no cross-tenant access possible
- In-memory storage means no persistent data exposure on disk

---

## Appendix: Key Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `IncomingChatChannelBufferSize` | 10 | Per-chat command queue depth |
| `OutgoingChannelBufferSize` | 20,000 | Per-connection response queue depth |
| `AIMessageTimeout` | 20s | Complete message processing timeout |
| `TextToSpeechTimeout` | 15s | TTS generation timeout |
| `SendChatTimeout` | 15s | OpenAI API call timeout |
| `DocumentSearchTimeout` | 5s | Elasticsearch query timeout |
| `SupernodeConnectionTimeoutSeconds` | 120s | TCP connection idle timeout |
| `InactiveChatExpirationSeconds` | 600s | Chat session inactivity TTL |
| `MaxMessageHistory` | 20 | Messages retained per chat |
| `maxPreviousMessagesContextTokens` | 1,000 | Chat history token budget |
| `maxCurrentMessageTokens` | 250 | User message token limit |
| `maxToolTokens` | 2,500 | Retrieved document token budget |
| `elastic_max_results` | 5 | Max search results per query |
| `readBlockSize` | 1,024 | TCP read buffer size |
| `SuggestedQuestionsExpirationSeconds` | 86,400 | Suggested questions cache TTL |
| `SummarizationRateLimitPerHour` | 10 | Max summarization requests per user per hour |
