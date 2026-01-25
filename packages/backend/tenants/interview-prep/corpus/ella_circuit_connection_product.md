# Ella → Circuit: Product Thinking

**Purpose:** Demonstrate product-level understanding of how AI knowledge platforms serve users, and why your Zello experience maps directly to Circuit's mission
**For Use In:** Jackie Padgett interview (CPO screen), product-focused conversations
**Last Updated:** January 24, 2026

---

## The Same Problem, Different Industries

### What Zello's Ella Solves

A hotel housekeeper needs to know the checkout cleaning procedure for a VIP suite. She could:
- **Before Ella:** Find a supervisor, wait for a response, look through a binder, call the front desk
- **After Ella:** Press a button, ask Ella, get the answer in seconds, keep working

Ella turns static company knowledge into **on-demand, voice-accessible answers** for frontline workers who don't sit at desks.

### What Circuit's Document AI Solves

A field technician needs to find the thermal rating for a specific motor model. She could:
- **Before Circuit:** Search through hundreds of PDF spec sheets, call the manufacturer, wait for engineering to respond
- **After Circuit:** Search the knowledge platform, get the exact specification with context, resolve the issue on-site

Circuit turns complex manufacturing documentation into **searchable, understandable, actionable knowledge** for industrial professionals.

### The Common Insight

Both products recognize the same fundamental truth: **knowledge trapped in documents is knowledge wasted.** The people who need information most urgently - frontline workers, field technicians, sales reps - are the ones with the least time to search for it.

---

## User Empathy I've Developed

### Understanding Frontline Knowledge Needs

Working on Ella taught me how non-desk workers interact with information:

**1. They need answers, not documents.**
A technician doesn't want to read a 200-page manual. They want: "The thermal rating for Model X is 85°C continuous." Ella's prompts enforce this - responses are 1-3 sentences maximum. Circuit's users have the same need.

**2. Context matters enormously.**
"What's the procedure?" means completely different things depending on who's asking, where they are, and what they're doing. Ella maintains conversation memory for follow-ups. Circuit's users similarly need context-aware responses - "What's the replacement part?" only makes sense if the system knows which product they're working on.

**3. Trust requires grounding.**
If an AI assistant makes something up about a safety procedure, someone could get hurt. Ella forces every response through document retrieval first - it can only answer from the knowledge base. Circuit faces the same stakes: wrong technical specifications could mean equipment failure, compliance violations, or safety incidents.

**4. Different users need different experiences.**
At Zello, we built three distinct interaction modes:
- **Default:** Concise, knowledge-grounded answers for experienced workers
- **Onboarding:** Guided, patient responses for new employees
- **Kiosk:** Ultra-brief, single-sentence answers for retail settings

Circuit has the same diversity: a sales engineer configuring a product needs a different experience than a field technician troubleshooting equipment, which is different from a distributor looking up pricing.

---

## Product Parallels

| Ella (Zello) | Document AI (Circuit) |
|--------------|----------------------|
| **Frontline workers** in hospitality, retail, transportation | **Industrial professionals** in manufacturing, field service |
| **Voice-first** - push-to-talk interface | **Search-first** - web-based knowledge platform |
| **Company knowledge base** (procedures, policies, training) | **Technical documentation** (specs, manuals, drawings) |
| **Permission-scoped** - different teams see different docs | **Network-scoped** - dealers, distributors, technicians see relevant docs |
| **Reduce time-to-answer** for operational questions | **Reduce time-to-answer** for technical questions |
| **Onboarding acceleration** for new employees | **Partner enablement** for new distributors |

---

## How This Shapes My Approach to Circuit

### Product Instincts I'd Bring

**1. Search Quality is the Product**

At Zello, I learned that if the AI gives wrong or irrelevant answers, users abandon it within a week. The search quality IS the product. Everything else - beautiful UI, fast loading, great design - is irrelevant if the answers are wrong.

For Circuit, this means the Principal Frontend Engineer needs to obsess over:
- How search results are presented (ranking, highlighting, confidence)
- How users refine queries when the first answer isn't right
- How the system handles "I don't know" gracefully
- How users provide feedback on answer quality

**2. Progressive Disclosure is Critical**

Manufacturing documentation is dense. You can't show everything at once. At Zello, we limited responses to 1-3 sentences. Circuit needs a similar philosophy:
- Show the direct answer first
- Let users drill into the source document
- Provide related specifications in context
- Link to full documentation when needed

**3. User Trust is Built Through Transparency**

Ella attributes answers to source documents. Users trust it because they can verify. Circuit's users - engineers, technicians, compliance officers - need even more transparency:
- Which document did this come from?
- What version is it?
- When was it last updated?
- Is this the authoritative source?

**4. Multi-Persona Design is Essential**

At Zello, we built three interaction modes because different users have fundamentally different needs. Circuit has an even more diverse user base:
- **Sales engineers** need product comparison and configuration
- **Field technicians** need step-by-step procedures
- **Distributors** need product specs and pricing
- **Support agents** need troubleshooting guides
- **Compliance officers** need regulatory documentation

Each persona deserves a tailored experience.

---

## Talking Points for Jackie

### The Story

> "At Zello, I worked on Ella - an AI assistant that gives frontline workers instant answers from their company's knowledge base. A hotel housekeeper can ask about cleaning procedures, a warehouse worker can check safety protocols. The core challenge is the same one Circuit is solving: knowledge trapped in documents is knowledge wasted. The people who need answers most urgently have the least time to search."

### The Product Insight

> "What I learned building Ella is that search quality is the product. If the AI gives wrong answers, users abandon it immediately. Everything else - beautiful design, fast loading - is irrelevant if the answers aren't accurate. I imagine that's even more true in manufacturing, where wrong specifications could mean equipment failure."

### The User Empathy

> "Ella taught me how non-desk workers interact with information. They need answers, not documents. They need context-aware responses. And they need to trust the system. We built different interaction modes for different user types - experienced workers get concise answers, new employees get guided onboarding. Circuit has an even more diverse user base, and I'd bring that same multi-persona thinking."

### The Mission Connection

> "Both Ella and Circuit share a mission: democratize access to knowledge. At Zello, it's frontline workers who don't sit at desks. At Circuit, it's manufacturing professionals navigating complex technical ecosystems. I find that mission genuinely compelling."
