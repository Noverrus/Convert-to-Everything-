# Enterprise File Converter Platform

A full-stack, enterprise-grade file media converter. This application uses a decoupled microservices architecture designed to entirely bypass frontend server payload limits (such as Vercel constraints), ensuring highly robust scalability for processing files up to 1GB+.

![App Setup State](https://img.shields.io/badge/Architecture-Next.js%20%2B%20Supabase%20%2B%20Express-blue)

## Architecture Overview

1. **Frontend (Next.js)**: Utilizes Supabase JS to stream large uploads *directly* into the cloud storage buckets, omitting any processing pressure from Next.js serverless functions.
2. **Postgres Realtime (DB)**: Maintains state transitions via Row-Level instances watched live globally.
3. **Task Worker Node (Express/Node.js)**: An independently scaled computing pipeline listening via Database Webhooks. Processes payloads heavily with `sharp` and pushes optimized conversions back, subsequently mutating the active Realtime states.
4. **Autonomous GC**: Employs `pg_cron` extensions for rigorous 1-Hour memory flushing and payload sweeping.

## Code Directory Flow

- `/src/lib/supabase`: Primary database connection pool configurations.
- `/src/app/image/page.tsx`: Advanced UI with zero limits directly tracking Postgres state chunks payload events.
- `/worker-service`: Deploy this standard Express microservice on Render, Railway, or AWS to absorb the main computational costs.

## Initial Setup & Initialization

### Next.js Vercel Frontend
```bash
# Instantiate framework (If building from scratch)
npx create-next-app@latest file-converter-pro --typescript --tailwind --eslint

# Sync platform dependencies
npm install @supabase/supabase-js lucide-react clsx tailwind-merge

# Start local Next/Vite dev stream
npm run dev
```

### Worker Service Layer
```bash
cd worker-service

# Ensure microservice runtime dependencies
npm install

# Test Worker on :8080 manually
npm run start
```


## Contribution

1. Fork the repository
2. Create a feature branch
3. Commit your changes strictly conforming to Prettier styles (`.prettierrc.json`)
4. Open a Pull Request
