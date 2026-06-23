# Image Batch Converter Pro

A high-performance file media converter built with React (Vite) and an Express fallback backend. This application uses a dual-engine architecture:
1. **Local Browser Engine**: Heavy lifting is done on the client side using Web Workers and WebAssembly (WASM), processing standard images and formats like HEIC entirely locally to preserve privacy and reduce server costs.
2. **Cloud Fallback Engine**: Advanced and uncommon formats (such as AVIF, EPS, DDS, DPX, PCX, PPM, DJV, WMZ, ART) trigger a fast proxy fallback that streams the file to the Express server for heavy-duty conversion using Node.js tools.

![App Setup State](https://img.shields.io/badge/Architecture-React%20%2B%20Vite%20%2B%20Express-blue)

## Architecture Overview

- **Frontend (React + Vite)**: Provides a drag-and-drop interface, managing a local queue of jobs via background Web Workers.
- **Web Workers**: Enables true multithreaded processing, separating UI rendering from heavy image encoding/decoding.
- **Express Backend (`server.ts`)**: Acts as an API proxy and fallback processing unit. Capable of processing image buffers with libraries like `sharp` for advanced format handling.

## Code Directory Flow

- `/src/pages/ImageConverter.tsx`: Advanced UI tracking conversion jobs.
- `/src/workers/converter.worker.ts`: Web Worker script mapping standard processing and triggering cloud fallback for unsupported types.
- `/server.ts`: Express backend handling cloud fallback proxying and custom format processing.

## Initial Setup & Initialization

### Environment Variables
Configure your environment using the `.env.example` file. Avoid storing API secrets in client-side code directly unless necessary (use `VITE_` prefix only for public keys).

### Run Local Environment
```bash
# Sync platform dependencies
npm install

# Start local React/Vite dev stream (with Express proxy)
npm run dev
```

## Licensing

**Copyright (c) 2026 Noverrus Dev. Hak Cipta Dilindungi Undang-Undang.**

Please see the `LICENSE` file for usage restrictions. Commercial use is strictly prohibited.
