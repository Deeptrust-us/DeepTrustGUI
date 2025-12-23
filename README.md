## DeepTrustGUI

Frontend GUI built with **Vite + React + TypeScript** (Tailwind + shadcn/ui). It provides:

- **Media capture & upload** for deepfake detection (camera video/audio, photo capture, screen recording, file upload).
- **Result details + history** view backed by the backend logging endpoints.
- **PWA support** via `vite-plugin-pwa` (service worker registration in `src/main.tsx`).

## Quickstart (local)

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env` file in the project root (you can copy from `env.example`). At minimum you need:

- `VITE_API_BASE_URL` (**required**): base URL for the backend API (used by Axios in `src/api/baseApi.ts`).

Example `.env.example`

### 3) Run the dev server

```bash
npm run dev
```

Then open:

- App: `http://localhost:8080/`

## Configuration (env vars)

### Required

- **`VITE_API_BASE_URL`**: backend API base URL (example: `http://localhost:8000`). The frontend calls endpoints like:
  - `POST /analyze_image`
  - `POST /analyze_video`
  - `POST /analyze_audio`
  - `GET /logs/all`
  - `GET /logs/get_by_id?id=...`
  - `DELETE /logs/delete_by_id?id=...`

## Backend contract (API overview)

All media requests are `multipart/form-data` with form field **`file`**.

- **Image**: `POST /analyze_image`
- **Video**: `POST /analyze_video`
- **Audio**: `POST /analyze_audio`
- **Logs**:
  - `GET /logs/all`
  - `GET /logs/get_by_id?id=...`
  - `DELETE /logs/delete_by_id?id=...`

## Scripts

- **Dev**: `npm run dev` (Vite dev server; configured to run on port `8080` in `vite.config.ts`)
- **Build**: `npm run build` (outputs static assets to `dist/`)
- **Preview production build**: `npm run preview`
- **Lint**: `npm run lint`

## Architecture (high level)

- **App entrypoint**: `src/main.tsx`
  - Mounts React app
  - Registers the PWA service worker (auto-update)
- **Routing**: `src/App.tsx`
  - `/` main app (scanner/upload/paste/screen recorder + history)
  - `/scan_result/:id` scan result details (fetches log row by id)
- **API layer**: `src/api/`
  - `baseApi.ts` creates the Axios instance using `VITE_API_BASE_URL`
  - `imageDetection.ts`, `videoDetection.ts`, `audioDetection.ts` call `/analyze_*`
  - `handling/apiLogHandling.ts` calls `/logs/*`
- **UI components**: `src/components/`
  - `Scanner.tsx`: capture from camera/mic and send to backend
  - `ScreenRecorder.tsx`: record the screen and send to backend
  - `Upload.tsx`: upload demo files or user files and send to backend
  - `History.tsx`: list/delete scan logs; deep-links to result details

## Demo media

The repo includes demo assets under `public/demos/` (images, audio, video) used by the in-app demo menu.

## Directory structure

```text
DeepTrustGUI/
  public/
    demos/
      ...
  src/
    api/
      audio/
      image/
      video/
      handling/
      baseApi.ts
    components/
      ui/
      Scanner.tsx
      ScreenRecorder.tsx
      Upload.tsx
      History.tsx
    pages/
      MainApp.tsx
      ScanResult.tsx
      NotFound.tsx
    App.tsx
    main.tsx
  vite.config.ts
  package.json
```

## Deployment note

This is a static frontend. Deploy the contents of `dist/` produced by `npm run build` to any static host.

- **Important**: `VITE_API_BASE_URL` is embedded at build time by Vite. Make sure it points to the correct backend in the environment where you build.
