# 📚 Collabryx Documentation

**Last Updated:** 2026-06-03  
**Version:** 4.2.0

---

## Quick Navigation

| Category | Description |
|----------|-------------|
| [🏗️ Getting Started](./01-getting-started/installation.md) | Installation, setup, and development workflow |
| [🏛️ Architecture](./02-architecture/overview.md) | System design, tech stack, data flow |
| [🎯 Core Features](./03-core-features/) | Matching, messaging, auth, AI assistant, embeddings |
| [⚙️ Infrastructure](./04-infrastructure/) | Database, Python worker, performance |
| [🚀 Deployment](./05-deployment/overview.md) | Production deployment, runbook, docker |
| [🤝 Contributing](./06-contributing/guide.md) | How to contribute, code standards, git workflow |
| [📖 Reference](./07-reference/) | Environment variables, commands, troubleshooting |
| [🗄️ Database Seeding](./08-database-seeding/README.md) | Seed data for development |
| [🎨 Design System](./DESIGN-SYSTEM.md) | UI design tokens, components, patterns |
| [🔒 Security](./SECURITY.md) | Security architecture, RLS, rate limiting |

---

## Documentation Map

```
docs/
├── README.md                         ← You are here
├── DESIGN-SYSTEM.md                   # Design tokens, glass tiers, component standards
├── FRONTEND-INTEGRATION-GUIDE.md      # Frontend API integration patterns (reference)
├── IMPLEMENTATION_PLAN.md             # AI Mentor enhancement plan (v1, partially implemented)
├── SECURITY.md                        # Security architecture & RLS
├── 01-getting-started/
│   ├── installation.md               # Prerequisites & local setup
│   └── development.md                # Daily dev workflow & standards
├── 02-architecture/
│   ├── overview.md                   # System architecture deep-dive
│   ├── diagrams.md                   # Visual architecture diagrams (Mermaid)
│   └── user-stories-and-sequence-diagrams.md  # 115 user stories, 56 diagrams
├── 03-core-features/
│   ├── api-reference.md              # API endpoints & Server Actions
│   ├── authentication.md             # Supabase Auth setup & patterns
│   ├── matching-system.md            # Hybrid matching algorithm
│   ├── messaging.md                  # Real-time messaging implementation
│   ├── ai-assistant/
│   │   └── overview.md              # AI Mentor system (current architecture)
│   └── vector-embeddings/
│       └── overview.md              # Vector similarity search & embeddings
├── 04-infrastructure/
│   ├── performance.md                # Performance optimization guide
│   ├── database/
│   │   ├── schema.md                # DB schema reference (38 tables)
│   │   ├── setup-guide.md           # Database setup instructions
│   │   └── embeddings.md            # Embedding system deep-dive
│   └── python-worker/
│       ├── overview.md              # Python Worker FastAPI service
│       ├── deployment.md            # Production deployment guide
│       └── development.md           # Local development guide
├── 05-deployment/
│   ├── overview.md                  # Production deployment guide
│   ├── checklist.md                 # Deployment checklist
│   ├── docker-scripts.md            # Docker management scripts
│   └── runbook.md                   # Production runbook
├── 06-contributing/
│   ├── guide.md                     # Full contributing guide
│   └── git-workflow.md              # Git conventions & workflow
├── 07-reference/
│   ├── commands.md                  # All bun scripts & commands
│   ├── environment-variables.md     # Env var reference
│   └── troubleshooting.md           # Common issues & solutions
└── 08-database-seeding/
    ├── README.md                    # Complete seeding guide
    └── QUICK_REFERENCE.md           # Seeding cheat sheet
```

**Total: 35 documentation files**

---

## Quick Links

- [🔙 Main README](../README.md)
- [🐛 Issue Tracker](../ISSUES.md)
- [🤖 Agent Development Guide](../AGENTS.md)

---

## Status Legend

| Badge | Meaning |
|-------|---------|
| ✅   | Up-to-date |
| 🔄   | Needs review |
| 📝   | Reference (historical) |
