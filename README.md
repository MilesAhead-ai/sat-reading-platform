# SAT Reading Platform

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

An adaptive Digital SAT Reading & Writing practice platform with IRT-based skill estimation, AI-powered coaching, spaced repetition, and personalized exercise selection.

## Quick Start

Get the app running locally in under 5 minutes. You need **Node.js >= 20**, **pnpm >= 9**, and **Docker**.

```bash
# 1. Clone and set up
git clone https://github.com/your-org/sat-reading-platform.git
cd sat-reading-platform
cp .env.example .env

# 2. Install, set up database, and seed content
pnpm install
docker-compose up -d postgres redis
cd packages/shared && npx tsc && cd ../..
cd apps/api && pnpm migration:run && pnpm seed && cd ../..

# 3. Launch!
./start.sh
```

Open **http://localhost:3001** in your browser. Register an account and start practicing!

> **Tip:** To enable AI features (coaching, exercise generation), add an API key to `.env` — see [LLM Configuration](#llm-configuration). Everything else works without it.

To stop all services:
```bash
./stop.sh
```

## What You Can Do

1. **Take the Diagnostic** — a 30-question adaptive test that profiles your strengths across all Digital SAT reading skills
2. **Practice** — the system picks exercises targeting your weakest skills at the right difficulty
3. **Review Queue** — missed questions come back via spaced repetition
4. **Mock Tests** — full 54-question timed tests with score projection (200–800)
5. **AI Coaching** — chat with a tutor for strategies and step-by-step explanations *(requires LLM)*
6. **Knowledge Base** — browse strategies, guides, and vocabulary tips
7. **Track Progress** — skill estimates, mastery levels, study streaks, and score trends

## Features

- **Digital SAT Format** — one short passage per question, matching the 2024+ exam
- **IRT Skill Estimation** — Item Response Theory models track ability per skill area
- **Adaptive Difficulty** — questions calibrated to challenge without overwhelming
- **Spaced Repetition** — wrong answers automatically queued for review at optimal intervals
- **AI-Powered Content** — generate new exercises targeting specific weaknesses
- **Multi-Provider LLM** — choose OpenAI or Anthropic
- **Score Projection** — estimate your SAT score range based on current performance

## LLM Configuration

AI features are **optional**. Set `LLM_PROVIDER` in `.env` to enable them:

| Provider | Config |
|----------|--------|
| **OpenAI** | `LLM_PROVIDER=openai` + `OPENAI_API_KEY=sk-...` |
| **Anthropic** | `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY=sk-ant-...` |
| **None** | Leave `LLM_PROVIDER` unset — core features still work |

Optional overrides: `OPENAI_MODEL`, `ANTHROPIC_MODEL`, `OPENAI_BASE_URL`, `ANTHROPIC_BASE_URL`.

## Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Next.js    │───>│   NestJS     │───>│  PostgreSQL  │
│   Frontend   │    │   API        │    │              │
│   :3001      │    │   :3000      │    │   :5432      │
└──────────────┘    └──────┬───────┘    └──────────────┘
                           │
                    ┌──────┴───────┐    ┌──────────────┐
                    │  LLM Provider│    │    Redis      │
                    │  (optional)  │    │    :6379      │
                    └──────────────┘    └──────────────┘
```

| Service | Tech | Description |
|---------|------|-------------|
| **Web** | Next.js 14 + Tailwind | Student-facing frontend |
| **API** | NestJS + TypeORM | Auth, practice, diagnostics, progress, coaching |
| **PostgreSQL** | PostgreSQL 16 | Primary database |
| **Redis** | Redis 7 | JWT refresh token storage |

## Adding Your Own Content

The platform ships with sample exercises. To add more:

1. Create `apps/api/src/database/seeds/content-custom.seed.ts` following the pattern in `content.seed.ts`
2. Each question has its own short passage (25–150 words), 4 choices, an explanation, and skill mapping
3. Import your seed in `run-seed.ts` and run:
   ```bash
   cd apps/api && pnpm seed
   ```

## Project Structure

```
├── apps/
│   ├── api/                  # NestJS backend
│   │   └── src/
│   │       ├── modules/      # auth, practice, diagnostic, coaching, etc.
│   │       ├── services/     # LLM, skill estimator, exercise selector
│   │       └── database/     # entities, migrations, seeds
│   ├── web/                  # Next.js frontend
│   │   └── src/app/          # dashboard, practice, progress, coaching
│   └── ai-service/           # FastAPI (IRT calibration)
├── packages/shared/          # shared types and constants
├── start.sh / stop.sh        # launch/stop all services
├── docker-compose.yml
└── .env.example
```

## Development

```bash
# API in watch mode
cd apps/api && pnpm dev

# Web in dev mode
cd apps/web && pnpm dev

# Type-check
cd apps/api && npx tsc --noEmit

# Generate a migration
cd apps/api && pnpm migration:generate src/database/migrations/MigrationName

# Stop Docker services
docker-compose down
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[Apache 2.0](LICENSE)
