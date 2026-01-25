# Ella → Circuit: Balanced View

**Purpose:** Connect Zello Ella AI experience to Circuit's Document AI with equal weight on technical credibility and product/business understanding
**Best Version For:** Jackie Padgett interview - shows you can speak her language while having substance behind it
**Last Updated:** January 24, 2026

---

## The Elevator Pitch

> "At Zello, I worked on Ella - a production AI assistant that gives frontline workers instant answers from their company's knowledge base. Under the hood, it's a RAG system: we ingest documents, create semantic embeddings, and use LLM function calling to retrieve and synthesize answers. The problem we're solving is the same one Circuit tackles in manufacturing: knowledge trapped in documents is knowledge wasted."

---

## What Ella Is

**Ella** is Zello's AI voice assistant for frontline workers - hotel staff, warehouse workers, retail associates. Instead of searching through binders or waiting for a supervisor, workers press a button, ask a question, and get an answer in seconds.

**The business value:** Reduced time-to-answer, faster onboarding, fewer errors from outdated or misremembered procedures.

**The technical foundation:** A Go microservice implementing RAG (Retrieval-Augmented Generation) with OpenAI GPT-4.1-mini, Elasticsearch semantic search, and a real-time voice pipeline.

---

## How Ella Maps to Circuit

### The Problem (Identical)

| Ella | Circuit |
|------|---------|
| Frontline workers can't quickly find procedures and policies | Manufacturing professionals can't quickly find specs and documentation |
| Knowledge trapped in company documents | Knowledge trapped in PDFs, drawings, manuals |
| Workers need answers, not documents | Engineers and technicians need answers, not documents |
| Wrong answers = safety risk, operational errors | Wrong answers = equipment failure, compliance violations |

### The Users (Analogous)

| Ella Users | Circuit Users |
|------------|---------------|
| Hotel housekeeper → "What's the VIP checkout procedure?" | Field technician → "What's the thermal rating for Model X?" |
| Warehouse worker → "What's the hazmat protocol?" | Sales engineer → "What are the compatible accessories?" |
| New hire → "Where do I clock in?" | New distributor → "How do I configure this product?" |
| Retail associate → "What's the return policy?" | Support agent → "What's the troubleshooting sequence?" |

### The Architecture (Parallel)

**What I built at Zello:**

```
User Question → Document Retrieval → LLM Synthesis → Answer
```

Specifically:
1. **Document ingestion** - Sync from S3, chunk into searchable segments
2. **Semantic embeddings** - Elasticsearch ELSER-2 for meaning-based search (not just keywords)
3. **Permission filtering** - Different users see different documents based on role and network
4. **Two-stage LLM processing** - First retrieve relevant docs, then generate a grounded answer
5. **Multi-mode prompts** - Different response styles for different user contexts
6. **Quality safeguards** - Forced document grounding prevents hallucination

**What Circuit is building:**

The same fundamental pipeline at manufacturing scale:
1. **Document ingestion** - PDFs, technical drawings, spec sheets, compliance documents
2. **Semantic search** - "thermal ratings" finds "operating temperature specifications"
3. **Access control** - Dealers see their products, technicians see their service docs
4. **AI synthesis** - Turn dense technical content into actionable answers
5. **Context-aware responses** - Sales needs different answers than field service
6. **Accuracy guarantees** - Wrong specs could mean equipment failure

---

## Three Things I Learned Building Ella

### 1. Search Quality is the Whole Product

If the AI gives wrong or irrelevant answers, users abandon it within days. At Zello, we force every response through document retrieval first - the model can only answer from the knowledge base. We found that hallucination on operational procedures is unacceptable.

**For Circuit:** Manufacturing has even higher stakes. A hallucinated thermal rating or wrong torque specification could cause equipment failure. The frontend needs to make search quality visible - showing sources, confidence levels, and document versions.

**Technical detail:** We use a forced function calling pattern where the LLM must call `retrieve_relevant_documents` before answering. This architectural decision means the model never generates unsourced claims.

### 2. Different Users Need Different Experiences

At Zello, we built three interaction modes:
- **Default** - Concise (1-3 sentences), grounded, for experienced workers
- **Onboarding** - Patient, guided, for new employees
- **Kiosk** - Ultra-brief (single sentence), for retail settings

**For Circuit:** The user diversity is even greater. A sales engineer configuring a complex product needs a guided workflow. A field technician needs a quick spec lookup. A distributor needs product comparisons. A compliance officer needs regulatory traceability. Each persona needs a distinct frontend experience.

**Technical detail:** This is implemented through different system prompts that shape the LLM's response style, combined with permission-scoped document access that controls what each user can see.

### 3. Document Access Control is a First-Class Concern

At Zello, every search is filtered by network (tenant), user permissions, and group permissions. A hotel chain's procedures shouldn't leak to another company. A kiosk user should only see directly relevant documents.

**For Circuit:** The access control model is more complex. A manufacturer wants their internal team to see everything, but distributor A should only see products they sell - not distributor B's pricing or inventory. Partner enablement requires careful document scoping.

**Technical detail:** We build Elasticsearch queries with boolean `must` clauses that combine semantic relevance with permission filters. The permission model is enforced at the search layer, not the application layer.

---

## Why This Experience Matters for the Principal Frontend Engineer Role

### I Understand the Full Stack of an AI Product

As a Principal Frontend Engineer at Circuit, I won't just be building UI components. I'll be designing the interface between users and an AI knowledge system. My experience with Ella means I understand:

- **What happens behind the search box** - Embeddings, retrieval, synthesis
- **Why response latency matters** - Two-stage LLM calls add seconds; the UI needs to manage that
- **How to surface confidence and sources** - Users need to verify AI answers
- **When to show documents vs. answers** - Sometimes the raw spec sheet is better than a synthesis
- **How permission models affect UX** - "No results" might mean "no access" - the UI must distinguish

### I Can Bridge Product and Engineering

Jackie's role as CPO means she cares about culture, team collaboration, and how engineering serves the product. My Ella experience demonstrates:

- **Product empathy** - I understand why frontline/manufacturing workers need instant answers
- **Technical grounding** - I can articulate the "why" behind architectural decisions
- **User-centered thinking** - Different users need different experiences, not one-size-fits-all
- **Quality obsession** - Search accuracy isn't a nice-to-have, it's the product

---

## Talking Points for Jackie's Interview

### If She Asks "Tell me about your AI experience"

> "At Zello, I worked on Ella - an AI assistant for frontline workers. It's a RAG system: we ingest company documents, create semantic embeddings for search, and use an LLM to synthesize answers. A hotel housekeeper can ask about procedures and get an instant, grounded response. The technical challenge was making sure the AI only answers from the knowledge base - hallucination on safety procedures is unacceptable. That same challenge is central to Circuit's Document AI, where wrong specifications could mean equipment failure."

### If She Asks "Why Circuit?"

> "Ella showed me the power of making knowledge accessible to people who need it. At Zello, it's frontline workers. At Circuit, it's manufacturing professionals navigating complex technical ecosystems. I've seen firsthand how much impact this kind of product has - reducing time-to-answer from hours to seconds changes how people work. I want to bring that experience to Circuit and help build the frontend that makes it happen."

### If She Asks About Collaboration

> "Building Ella required tight collaboration between frontend, backend, and AI teams. The UX decisions - how to display results, how to handle 'I don't know,' how to build different modes for different users - all required understanding the technical constraints. I learned to translate between product thinking and engineering implementation. That's exactly what a Principal Frontend Engineer at Circuit needs to do."

### If She Asks What Excites You About the Role

> "I'm excited about the UX challenge. How do you make millions of pages of technical documentation navigable and useful? That's a design problem, an engineering problem, and a product problem all at once. Building Ella taught me that the interface between users and AI knowledge systems is where the magic happens - or doesn't. I want to be the person who makes it happen at Circuit."
