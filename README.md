# RepoSage 

[![Tests](https://img.shields.io/badge/tests-13%20passed-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)]()

RepoSage is a production-ready AI Codebase Search Engine. It allows developers to chat with their entire Git repositories in real-time, utilizing an **Advanced Hybrid Search Pipeline** to achieve hyper-accurate code context retrieval.



## 🚀 Key Features

* **Advanced Hybrid Search (RRF):** Mathematically fuses BM25 Lexical Keyword matching with OpenAI `text-embedding-3-small` Semantic Vectors using Reciprocal Rank Fusion. Consistently outperforms naive semantic search on architectural reasoning by catching exact variable and function names.
* **Cross-File Architectural Context:** Excels at resolving complex dependencies by retrieving non-contiguous blocks of code from multiple different files simultaneously, allowing the LLM to understand how the frontend UI and backend controllers integrate without missing context.
* **Multi-Language AST Parsing:** Uses Tree-sitter (C/Rust bindings) to parse JavaScript, TypeScript, and Python code. Instead of randomly chopping files every 100 lines, it chunks code logically by functions and classes to preserve architectural context.
* **Dual-Mode LLM Pipeline:** 
  * **Streaming Mode:** Streams answers in real-time and runs a custom regex-based **Citation Validator** at the end. If the LLM hallucinates a file path that does not exist in the retrieved context, a hallucination warning is appended to the UI.
  * **Strict Mode (Self-Healing):** A non-streaming fallback mode that forces the LLM to output a strict `json_object` to guarantee accurate citations.
* **Resilient Vector Database Architecture:** Built on PostgreSQL (pgvector, IVFFlat `lists=100`) with `ON DELETE CASCADE` schemas, intelligent deduplication, and TTL cleanup scripts designed for CRON integration to purge orphaned vectors and manage cost.
* **Supabase Native Admin Dashboard:** Features a secure Admin Dashboard built entirely on PostgreSQL Row-Level Security (RLS) policies, requiring zero backend API routes to manage waitlisted users.
* **Enterprise-Grade API Security:** Protects heavy LLM endpoints from DDoS and billing abuse using a strict IP-based Rate Limiter (`express-rate-limit`) combined with JWT-verified Role-Based Access Control.

## 🛠 Tech Stack

**Frontend:** React, Vite, CSS (Glassmorphism UI)
**Backend:** Node.js, Express.js
**Database & Auth:** Supabase (PostgreSQL), pgvector, Supabase Auth (Email/Password)
**AI & Vectors:** OpenAI API, Tree-sitter
**Queue & Cache:** BullMQ, Redis
**Testing:** Jest (Thorough unit testing on core algorithms)

## 🧪 Testing Proof

The core algorithms driving RepoSage (RRF Math and Citation Validation) are rigorously unit-tested. 

```bash
> jest

PASS src/services/citationValidator.test.js
PASS src/utils/rrfMath.test.js

Test Suites: 2 passed, 2 total
Tests:       13 passed, 13 total
Snapshots:   0 total
Time:        1.88 s
```

We rigorously test edge cases where Semantic Search highly ranks a chunk but Lexical Search completely misses it, ensuring the mathematical RRF algorithm scores and sorts the chunks correctly without failure. 

## ⚙️ Running Locally

### Prerequisites
- Node.js (v20+)
- A Supabase account
- A Redis instance (e.g., Upstash)
- An OpenAI API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/reposage.git
   ```

2. Install dependencies:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the `/server` and `/client` directories mapping your Supabase, Redis, and OpenAI credentials.

4. Start the servers:
   ```bash
   # In terminal 1
   cd server && npm run dev
   
   # In terminal 2
   cd client && npm run dev
   ```
