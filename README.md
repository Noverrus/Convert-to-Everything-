# WASM File Conversion Suite

A high-performance file media converter and processing suite built with React (Vite) as a 100% Client-Side, Privacy-First, Offline-capable application. This application uses a single Local Browser Engine architecture abandoning all server costs and payload limitations.

1. **Local Browser Engine**: Heavy lifting is done on the client side using Web Workers, Canvas APIs, and WebAssembly (WASM via FFmpeg), processing standard images and heavy media formats entirely locally to preserve privacy and reduce server costs.
2. **Absolute Privacy**: Files never upload anywhere. The processing happens strictly inside your device's memory. Unsafe or extremely obscure vector formats are gracefully rejected to preserve performance and privacy.
3. **Flat Design Style**: The interface employs a clean, elegant flat design style with minimal borders, flat pastel badges, custom layouts, and highly responsive horizontal navigation.

![App Setup State](https://img.shields.io/badge/Architecture-React%20%2B%20Vite%20%2B%20WASM-blue)

## Supported Offline Categories & Formats

Hanya format offline yang aman dan umum digunakan yang didukung. Format yang tidak didukung atau format vektor yang tidak direkomendasikan (seperti `.wmz`, `.wmf`, `.eps`, `.djv`) **ditolak secara otomatis** pada antarmuka upload file untuk menjaga performa dan memori perangkat.

* **Image Converter**:
  - **Input**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.heic`, `.heif`, `.bmp`, `.gif`, `.tif`, `.tiff`
  - **Output**: `.webp`, `.png`, `.jpg`, `.gif`
* **Document Converter**:
  - **Input/Output**: PDF and image manuscripts compilation offline.
* **Video Converter**:
  - **Input**: `.mp4`, `.webm`, `.avi`, `.mov`, `.mkv`, `.wmv`, `.flv`, `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.flac`
  - **Output**: `.mp4`, `.webm`, `.avi`, `.mp3`, `.wav`
* **Archive Manager**:
  - **Input/Output**: Pack folders and multiple files into optimized `.zip` files, or extract any `.zip` archive completely client-side in seconds using `jszip`.
* **CAD Vector Converter**:
  - **Input**: `.dxf`, `.svg`
  - **Output**: Render coordinates onto canvas and export as crisp `.png`, vector `.pdf`, or `.svg`.
* **Ebook Publisher**:
  - **Input**: `.txt`, `.md`, `.html`
  - **Output**: `.epub`, `.pdf`, `.txt`
* **Font CSS Packager**:
  - **Input**: `.ttf`, `.otf`, `.woff`, `.woff2`
  - **Output**: Previews custom fonts dynamically using the browser FontFace API and packages `@font-face` CSS code offline.
* **Presentation Slideshow**:
  - Design premium widescreen slides and compile beautiful presentation decks to high-resolution `.pdf`.
* **Spreadsheet & Data**:
  - Parse `.csv` files into well-structured `.json` data tables, or generate clean, comma-separated `.csv` sheets from JSON arrays.
* **Vector Rasterizer**:
  - Rasterize complex `.svg` vector paths into crisp `.png`, `.jpg`, `.webp`, or `.pdf` formats at custom scale multipliers (up to 4x resolution).

## Core Technologies

Website ini menggunakan teknologi mutakhir untuk konversi berbasis pada sisi klien sepenuhnya (WebAssembly dan Canvas API).

- **React + Vite**: Menghadirkan antarmuka (Frontend) yang sangat modern dan cepat.
- **Web Workers**: Mengaktifkan kemampuan pemrosesan multithreading yang memisahkan rendering antarmuka dari konversi gambar/media berbeban berat agar UI tidak freeze.
- **WebAssembly via FFmpeg (`@ffmpeg/ffmpeg`)**: Menjalankan file biner engine media konversi secara natif dan offline langsung di dalam memori sandbox web browser pengguna. Dilengkapi mode Queue sekuensial yang mengamankan memori saat memroses video berukuran besar.
- **HTML5 Canvas API / jsPDF**: Digunakan untuk ekstraksi dokumen dan pembuatan file PDF gabungan secara instan, sepenuhnya di klien.
- **JSZip**: Memberikan kemampuan Bulk Export (Download All as ZIP) dalam satu kali klik.

## Architecture Overview

- **Frontend (React + Vite)**: Provides a drag-and-drop interface, managing a local queue of jobs via background Web Workers.
- **Web Workers**: Enables true multithreaded processing, separating UI rendering from heavy image encoding/decoding.
- **Pure Client-Side**: 100% offline-capable rendering with zero backend node processes required.

## Initial Setup & Initialization

### Run Local Environment
```bash
# Sync platform dependencies
npm install

# Start local React/Vite dev stream
npm run dev
```

## Licensing

**Copyright (c) 2026 Noverrus Dev. Hak Cipta Dilindungi Undang-Undang.**

Please see the `LICENSE` file for usage restrictions. Commercial use is strictly prohibited.
