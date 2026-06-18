---
title: Collabryx Embedding Service
emoji: 🧠
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
---

# Collabryx Embedding Service

FastAPI service that generates 384-dimensional semantic embeddings for user profiles using Sentence Transformers (`all-MiniLM-L6-v2`).

Deployed on Hugging Face Spaces CPU (free tier) — part of the Collabryx microservice architecture.

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info & model details |
| `/health` | GET | Health check (Supabase connectivity + disk) |
| `/model-info` | GET | Embedding model metadata |
| `/generate-embedding` | POST | Queue an embedding generation request |
| `/generate-embedding-from-profile` | POST | Queue embedding from full profile data |

## Environment Variables (Repository Secrets)

| Secret | Required | Description |
|--------|----------|-------------|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (bypasses RLS) |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated CORS origins |
| `WORKER_API_KEY` | ❌ | API key for request authentication |

## Architecture

This service is consumed by the Collabryx frontend (Vercel) via `WorkerClient` in `lib/worker-client.ts`. Embeddings are stored in the `profile_embeddings` table in Supabase with a pgvector HNSW index.
