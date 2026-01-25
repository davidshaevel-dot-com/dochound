# AI/LLM Integration Interview Guide

**Purpose:** Technical interview preparation for Circuit, Emporia Research, and Autonomize AI
**Last Updated:** January 20, 2026

---

## Company-Specific AI Focus

| Company | AI Focus | Key Technologies |
|---------|----------|------------------|
| **Circuit** | Manufacturing AI knowledge platform | AI workflows, document processing |
| **Emporia** | B2B research platform | LangChain, Bedrock, Pinecone, Claude, ChatGPT, Llama |
| **Autonomize** | Health-tech platform | ML/DL integration, PyTorch, TensorFlow, HuggingFace |

---

## LLM Fundamentals

### How LLMs Work

```
Input Text → Tokenization → Embedding → Transformer Layers → Output Probability → Token Generation

Key Concepts:
- Tokens: Text broken into subwords (~4 chars/token for English)
- Context window: Maximum tokens model can process (4K-128K+)
- Temperature: Randomness in output (0=deterministic, 1=creative)
- Top-p (nucleus sampling): Probability threshold for token selection
```

### Model Comparison

| Model | Provider | Strengths | Context |
|-------|----------|-----------|---------|
| GPT-4 | OpenAI | Reasoning, code | 128K |
| Claude 3 | Anthropic | Analysis, safety, long context | 200K |
| LLama 3 | Meta | Open source, customizable | 8K-128K |
| Gemini | Google | Multimodal, speed | 1M |

### API Basics

```javascript
// OpenAI
const openAIResponse = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain RAG in simple terms.' }
  ],
  temperature: 0.7,
  max_tokens: 500
});

// Anthropic
const anthropicResponse = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  messages: [
    { role: 'user', content: 'Explain RAG in simple terms.' }
  ]
});
```

---

## RAG (Retrieval-Augmented Generation)

### Architecture

```
User Query
    ↓
Query Embedding (convert to vector)
    ↓
Vector Search (find similar documents)
    ↓
Context Assembly (combine relevant chunks)
    ↓
LLM Prompt (query + context)
    ↓
Generated Response
```

### Implementation

```javascript
// 1. Document Processing Pipeline
async function processDocument(doc) {
  // Split into chunks
  const chunks = splitIntoChunks(doc.content, {
    chunkSize: 1000,
    overlap: 200
  });

  // Generate embeddings
  const embeddings = await Promise.all(
    chunks.map(chunk => generateEmbedding(chunk))
  );

  // Store in vector database
  await vectorDB.upsert(
    chunks.map((chunk, i) => ({
      id: `${doc.id}-${i}`,
      values: embeddings[i],
      metadata: {
        text: chunk,
        source: doc.source,
        page: chunk.page
      }
    }))
  );
}

// 2. Query Pipeline
async function queryRAG(question) {
  // Embed the question
  const queryEmbedding = await generateEmbedding(question);

  // Search vector database
  const results = await vectorDB.query({
    vector: queryEmbedding,
    topK: 5,
    includeMetadata: true
  });

  // Build context
  const context = results.matches
    .map(m => m.metadata.text)
    .join('\n\n');

  // Generate response
  const response = await llm.chat({
    messages: [
      {
        role: 'system',
        content: `Answer based on the following context:\n\n${context}`
      },
      { role: 'user', content: question }
    ]
  });

  return {
    answer: response.content,
    sources: results.matches.map(m => m.metadata.source)
  };
}
```

### Chunking Strategies

| Strategy | Use Case | Pros | Cons |
|----------|----------|------|------|
| Fixed size | Simple documents | Easy to implement | May split sentences |
| Sentence-based | Natural text | Preserves meaning | Variable sizes |
| Recursive | Structured docs | Respects hierarchy | Complex to implement |
| Semantic | Mixed content | Best context | Computationally expensive |

```javascript
// Recursive text splitter (LangChain style)
function recursiveSplit(text, maxSize = 1000, overlap = 200) {
  const separators = ['\n\n', '\n', '. ', ' ', ''];

  function split(text, separators) {
    const sep = separators[0];
    const chunks = text.split(sep);

    const result = [];
    let current = '';

    for (const chunk of chunks) {
      if ((current + chunk).length > maxSize && current) {
        result.push(current.trim());
        // Keep overlap
        current = current.slice(-overlap) + sep + chunk;
      } else {
        current += (current ? sep : '') + chunk;
      }
    }

    if (current) result.push(current.trim());

    // If chunks still too big, use next separator
    if (separators.length > 1) {
      return result.flatMap(c =>
        c.length > maxSize ? split(c, separators.slice(1)) : [c]
      );
    }

    return result;
  }

  return split(text, separators);
}
```

---

## Vector Databases

### Pinecone (Emporia uses this)

```javascript
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const index = pinecone.index('my-index');

// Upsert vectors
await index.upsert([
  {
    id: 'doc-1',
    values: [0.1, 0.2, 0.3, ...],  // 1536 dimensions for OpenAI
    metadata: {
      text: 'Original document text',
      source: 'file.pdf',
      category: 'technical'
    }
  }
]);

// Query
const results = await index.query({
  vector: queryEmbedding,
  topK: 10,
  includeMetadata: true,
  filter: {
    category: { $eq: 'technical' }
  }
});

// Delete
await index.deleteMany(['doc-1', 'doc-2']);
```

### Other Vector Databases

| Database | Deployment | Features |
|----------|------------|----------|
| Pinecone | Managed | Filtering, namespaces, serverless |
| Weaviate | Self-hosted/Cloud | Hybrid search, GraphQL |
| Qdrant | Self-hosted/Cloud | Filtering, recommendations |
| Chroma | Self-hosted | Simple, Python-first |
| pgvector | PostgreSQL extension | SQL integration |

---

## LangChain

### Core Concepts

```javascript
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

// Basic chain
const model = new ChatOpenAI({ model: 'gpt-4' });
const prompt = PromptTemplate.fromTemplate(
  'Summarize the following text in {length} words:\n\n{text}'
);
const outputParser = new StringOutputParser();

const chain = RunnableSequence.from([prompt, model, outputParser]);

const result = await chain.invoke({
  length: '50',
  text: 'Long document text here...'
});
```

### RAG Chain

```javascript
import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { ChatPromptTemplate } from '@langchain/core/prompts';

// Setup
const embeddings = new OpenAIEmbeddings();
const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
  pineconeIndex: index
});
const retriever = vectorStore.asRetriever({ k: 4 });

const model = new ChatOpenAI({ model: 'gpt-4' });

// Create chain
const combineDocsChain = await createStuffDocumentsChain({
  llm: model,
  prompt: ChatPromptTemplate.fromTemplate(`
    Answer based on the following context:
    {context}

    Question: {input}
  `)
});

const retrievalChain = await createRetrievalChain({
  combineDocsChain,
  retriever
});

// Use
const response = await retrievalChain.invoke({
  input: 'What is the return policy?'
});
```

### Agents

```javascript
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { Calculator } from 'langchain/tools/calculator';
import { WebBrowser } from 'langchain/tools/webbrowser';

const tools = [
  new Calculator(),
  new WebBrowser({ model, embeddings })
];

const agent = await initializeAgentExecutorWithOptions(tools, model, {
  agentType: 'openai-functions',
  verbose: true
});

const result = await agent.invoke({
  input: 'What is 25% of the current Bitcoin price?'
});
```

---

## Prompt Engineering

### System Prompts

```javascript
// Effective system prompt structure
const systemPrompt = `
You are an expert assistant for [DOMAIN].

## Your Role
- [Specific responsibilities]
- [Boundaries and limitations]

## Guidelines
- Always cite sources when available
- If unsure, say so rather than guessing
- Format responses using markdown

## Output Format
[Specify expected structure]
`;
```

### Few-Shot Prompting

```javascript
const messages = [
  { role: 'system', content: 'Classify customer feedback as positive, negative, or neutral.' },
  { role: 'user', content: 'The product arrived on time and works great!' },
  { role: 'assistant', content: 'positive' },
  { role: 'user', content: 'Terrible experience, never buying again.' },
  { role: 'assistant', content: 'negative' },
  { role: 'user', content: 'It\'s okay, nothing special.' },
  { role: 'assistant', content: 'neutral' },
  { role: 'user', content: userInput }  // New input to classify
];
```

### Chain-of-Thought

```javascript
const prompt = `
Solve this step by step:
${problem}

Let's think through this:
1. First, identify the key information...
2. Then, apply the relevant formula...
3. Finally, calculate the result...

Solution:
`;
```

### Structured Output

```javascript
// Using function calling for structured output
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Extract info from: John is 30 years old and works at Google.' }],
  functions: [{
    name: 'extract_person',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
        company: { type: 'string' }
      },
      required: ['name']
    }
  }],
  function_call: { name: 'extract_person' }
});

const data = JSON.parse(response.choices[0].message.function_call.arguments);
// { name: 'John', age: 30, company: 'Google' }
```

---

## Embeddings

### Generating Embeddings

```javascript
// OpenAI
const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'Text to embed'
});
const embedding = response.data[0].embedding;  // Array of 1536 floats

// Batch processing
const texts = ['Text 1', 'Text 2', 'Text 3'];
const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: texts
});
const embeddings = response.data.map(d => d.embedding);
```

### Embedding Models

| Model | Dimensions | Provider | Use Case |
|-------|------------|----------|----------|
| text-embedding-3-small | 1536 | OpenAI | General purpose, cost-effective |
| text-embedding-3-large | 3072 | OpenAI | Higher quality, larger |
| Titan Embeddings | 1536 | AWS Bedrock | AWS integration |
| all-MiniLM-L6-v2 | 384 | HuggingFace | Free, fast, local |

### Similarity Search

```javascript
// Cosine similarity
function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Find most similar
function findMostSimilar(queryEmbedding, documents, k = 5) {
  return documents
    .map(doc => ({
      ...doc,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}
```

---

## MCP (Model Context Protocol)

### Your Experience - Zello Hackathon Project

```
MCP Server in Go
├── Stdio transport (for Claude integration)
├── HTTP REST endpoints
├── Tools:
│   ├── Message retrieval (Elasticsearch)
│   ├── Channel management (WebSocket)
│   └── Real-time communication
└── Integration with AI assistants
```

### MCP Concepts

```javascript
// MCP Server provides tools to AI models
{
  "tools": [
    {
      "name": "search_messages",
      "description": "Search message vault for specific content",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": { "type": "string" },
          "channel": { "type": "string" },
          "limit": { "type": "number" }
        }
      }
    }
  ]
}

// AI model calls the tool
{
  "tool": "search_messages",
  "arguments": {
    "query": "meeting notes",
    "channel": "general",
    "limit": 10
  }
}

// Server returns results
{
  "results": [
    { "id": "msg-123", "content": "Meeting notes from...", "timestamp": "..." }
  ]
}
```

---

## ML/DL Integration (Autonomize Focus)

### Model Serving

```python
# FastAPI model serving
from fastapi import FastAPI
from transformers import pipeline

app = FastAPI()
classifier = pipeline("sentiment-analysis")

@app.post("/predict")
async def predict(text: str):
    result = classifier(text)
    return {"sentiment": result[0]["label"], "score": result[0]["score"]}
```

### HuggingFace Transformers

```python
from transformers import AutoTokenizer, AutoModel
import torch

# Load model and tokenizer
tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
model = AutoModel.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")

def get_embedding(text):
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        outputs = model(**inputs)
    # Mean pooling
    embeddings = outputs.last_hidden_state.mean(dim=1)
    return embeddings[0].numpy()
```

### Model Fine-tuning

```python
from transformers import Trainer, TrainingArguments

training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=8,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    learning_rate=2e-5,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
)

trainer.train()
```

---

## Common Interview Questions

### Conceptual Questions

1. **What is RAG and when would you use it?**
   > RAG (Retrieval-Augmented Generation) combines information retrieval with LLM generation. Use it when you need the LLM to answer questions about specific, proprietary, or up-to-date information not in its training data.

2. **How do you handle hallucinations in LLMs?**
   > - Use RAG to ground responses in factual data
   > - Lower temperature for more deterministic outputs
   > - Ask model to cite sources
   > - Implement fact-checking validation
   > - Use structured output to constrain responses

3. **What's the difference between embeddings and tokens?**
   > Tokens are subword pieces used for input/output (text ↔ integers). Embeddings are dense vector representations of meaning (text → float array). Embeddings capture semantic similarity.

4. **How do you choose chunk size for RAG?**
   > Balance between:
   > - Too small: lose context
   > - Too large: dilute relevance, hit context limits
   > Start with 500-1000 characters, experiment based on document type and use case.

5. **Explain the vector search process**
   > 1. Convert query to embedding (same model as documents)
   > 2. Compare query embedding to stored embeddings using similarity metric (cosine, dot product)
   > 3. Return top-k most similar documents
   > 4. Use metadata filtering to narrow results if needed

---

## Your Experience Talking Points

### MCP Server Development

> "At Zello's hackathon, I built an MCP (Model Context Protocol) server in Go. It integrated with our Message Vault (Elasticsearch) and Channel API (WebSocket) to provide AI-powered tools for message retrieval and channel management. The server supported both MCP protocol via stdio for Claude integration and HTTP REST endpoints. This gave me hands-on experience with tool-augmented AI systems."

### AI Tool Usage

> "I use AI tools extensively in my daily development workflow. I work with Claude Code, Cursor IDE, and GitHub Copilot for coding assistance. I've evaluated multiple models - Claude Sonnet/Opus, GPT-4, Gemini - and understand their strengths and trade-offs. This experience helps me design effective prompts and understand how to integrate AI into applications."

### RAG Understanding

> "I understand the RAG pipeline from both a conceptual and implementation perspective. Document chunking, embedding generation, vector storage and retrieval, context assembly, and prompt engineering for grounded responses. At Zello, I worked with Elasticsearch which has similar vector search capabilities. The MCP server I built was essentially a tool provider for RAG-like workflows."
