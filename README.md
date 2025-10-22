# Enzonic Modularity Hub

This repository contains the Enzonic Modularity Hub: a full-stack web project with a modern React + Vite frontend and an Express + MySQL backend. The project bundles search, translation, chat and admin services and is designed to be modular and extensible.

This README explains how the project is implemented, describes the key folders and files, lists required environment variables, and shows how to run and develop locally.

## Table of contents

- Overview
- Architecture and major components
- Key files and where to look
- Backend: API, routes, controllers, database
- Frontend: pages, components, libraries
- Environment variables
- Development & run instructions
- Notes, caveats and next steps


## Overview

The repo is split into two main parts:

- `src/` — Frontend application built with React + TypeScript, Vite, TailwindCSS and a collection of reusable UI components (Radix, shadcn-style components). The frontend uses Clerk for authentication integration points, React Query for data fetching, and a small set of libs under `src/lib` for talking to backend APIs and external services.
- `backend/` — Node.js Express server (ES module) implementing REST endpoints for translations, searches, chats and admin operations. A MySQL database (mysql2) is used and initialized automatically from `backend/database/config.js`.


## Architecture and major components

- Frontend (SPA)
	- Built with Vite and React (TypeScript). The app bootstrap is in `src/main.tsx` and the top-level application in `src/App.tsx` which wires React Query, theming, Clerk provider and the router.
	- Pages live in `src/pages/` (e.g. `Index.tsx`, `SearchResults.tsx`, `Translate.tsx`, `Chatbot.tsx`). UI primitives and polished controls are in `src/components/ui/`.
	- Client-side API wrappers live in `src/lib/` (for example `searxngApi.ts`, `translationApi.ts`, `aiApi.ts`, `chatbotApi.ts`). They handle building requests, parsing responses and fallbacks for development.

- Backend (API)
	- Express server entry is `backend/server.js`. Routes are registered under `/api/*` and mounted with dedicated routers in `backend/routes/` (e.g. `translations.js`, `search.js`, `chats.js`, `admin.js`).
	- Controllers implement business logic in `backend/controllers/` (e.g. `translationController.js`, `chatController.js`, `searchStatsController.js`).
	- Database layer is implemented in `backend/database/config.js` using `mysql2/promise`. On startup the server initializes database tables and default service configuration rows.
	- Middleware includes CORS setup and JSON body parsing. Some route groups apply authentication middleware (Clerk) and activity logging.


## Key files and where to look

- Project root
	- `package.json` — scripts and workspace dependencies. `npm run dev` launches backend and vite concurrently.
	- `vite.config.ts` — Vite configuration, dev server proxy for `/api` -> `http://localhost:3001`.
	- `.env.example` — example environment variables required for dev.

- Frontend
	- `src/main.tsx` — mounts React app.
	- `src/App.tsx` — application layout, providers, routes.
	- `src/pages/` — top-level pages (home, search, admin, translate, chatbot, etc.).
	- `src/components/` — reusable UI primitives and composed UI parts (Navbar, Footer, Hero, InstantAnswers, components for drive/editor, admin views).
	- `src/components/ui/` — UI primitives (button, input, card, toaster, etc.) used across pages.
	- `src/lib/` — client-side API wrappers and helpers (see below for important files):
		- `searxngApi.ts` — search and autocomplete wrapper that calls backend `/api/search` endpoints (development includes mock response fallbacks).
		- `translationApi.ts` — client translations wrapper; talks to a translation endpoint and to the backend history endpoints.
		- `aiApi.ts` — AI/chat wrapper for talking to an OpenAI-compatible endpoint; supports streaming parsing and model configuration used by the chat UI.
		- `env.ts` — exports required Vite env variables and helpers.

- Backend
	- `backend/server.js` — Express app, middleware, route mounting and database initialization.
	- `backend/routes/*.js` — express routers for modules: `search.js`, `translations.js`, `chats.js`, `admin.js`, etc.
	- `backend/controllers/*.js` — controllers for each module implementing request handling and business logic.
	- `backend/database/config.js` — mysql2 pool, table creation scripts and persistence helpers (translation history, chat history, service configurations, statistics).


## Backend implementation details

- Server startup
	- `backend/server.js` loads environment with dotenv (looking for `../.env`), configures CORS with a list of allowed origins and sets body size limits.
	- It initializes the database by calling `initializeDatabase()` from `backend/database/config.js`. That file creates necessary tables if they do not exist and inserts default services into `service_configs`.

- Routes & controllers
	- Each feature generally has a router under `backend/routes/`. Routers wire middleware (authentication, logging) and route handlers from controllers in `backend/controllers/`.
	- `backend/controllers/translationController.js` exposes `saveTranslationController` and `getTranslationHistoryController` which delegate to `backend/database/config.js` persistence functions (`saveTranslation`, `getTranslationHistory`) and also record statistics.
	- `backend/routes/search.js` is a thin proxy to a SearXNG instance (configured with a base URL and secret). It provides endpoints for `GET /api/search/web` and `GET /api/search/autocomplete` with robust fallback logic that returns mocked results during development or when the real SearXNG instance isn't responding as JSON.

- Database
	- Database tables are created on startup and include: `translation_history`, `admin_data`, `service_configs`, `statistics`, `api_usage`, `chat_history`, `chat_sessions`, `search_statistics`.
	- Persistence helpers use prepared SQL queries and limit retention for some tables (for example, translation history keeps the most recent 5 entries per user; chat history keeps last 10 exchanges).


## Frontend implementation details

- Application providers
	- `src/App.tsx` wraps the app with `QueryClientProvider` (React Query), `ThemeProvider` (theming), Clerk provider (`ThemedClerkProvider`), and a `BrowserRouter` for client routes. ErrorBoundary and toast systems are integrated globally.

- API wrappers
	- `src/lib/searxngApi.ts` builds search queries and calls `GET /api/search/web`. Autocomplete uses `/api/search/autocomplete`. The wrapper provides typed interfaces and parses fallback/mock responses.
	- `src/lib/translationApi.ts` contains helpers for translating text via an API, saving translations to history via `POST /api/translations`, and fetching translation history via `GET /api/translations/history`. It accepts a `getToken` callback used to attach an Authorization header for protected endpoints.
	- `src/lib/aiApi.ts` provides functions to send chat completion requests to an OpenAI-compatible endpoint (using the URL in `VITE_OPENAI_API_URL`) and contains utilities to parse streaming responses.

- Pages and UX
	- `src/pages/Index.tsx` is the homepage: a search box with autocomplete, quick actions, and a random inspirational quote loaded from `quotes.json`.
	- `src/pages/SearchResults.tsx` uses `searxngApi.ts` to perform the web search and render results. Results render as cards using `src/components/ui/*` primitives.
	- `src/pages/Translate.tsx` talks to translation APIs and saves history using `translationApi.ts`.
	- `src/pages/Chatbot.tsx` (and related) use `aiApi.ts` for chat completions and streaming responses.


## Environment variables

Frontend (Vite) environment variables (prefixed with VITE_ and exposed to client):

- VITE_CLERK_PUBLISHABLE_KEY — Clerk publishable key for client authentication UI
- VITE_OPENAI_API_KEY — API key used by AI-related client helpers (if used client-side)
- VITE_OPENAI_API_URL — Optional override URL for the OpenAI-compatible AI API (default: https://ai-api.enzonic.me/api/v1/chat/completions)
- VITE_API_URL — Optional base URL for the backend API (if different from proxy)

Backend environment variables (stored in `backend/.env` or the repo root `.env` loaded by backend):

- CLERK_SECRET_KEY — Clerk server-side secret key
- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME — MySQL connection details used by `backend/database/config.js`
- Other service keys and secrets (e.g., SearXNG secret) may be configured inside `backend/routes/search.js` or via environment variables depending on deployment.

See `.env.example` for a minimal set of keys used during development.


## Development & run instructions

Prerequisites

- Node.js (>= 18 recommended)
- MySQL server if you plan to use persistent storage (or configure connection to a remote MySQL)

Local development (runs backend and frontend concurrently):

1. Install root dependencies and backend dependencies if needed:

```powershell
npm install
npm run backend:install
```

2. Create `.env` in the repository root (or configure `backend/.env`) using `.env.example` as a template and fill in database and Clerk/OpenAI keys.

3. Start development servers (this runs the backend and Vite in parallel):

```powershell
npm run dev
```

4. Open the frontend at the port Vite uses (configured in `vite.config.ts`, default host port: 8080). Backend runs on port 3001 by default and the Vite server proxies `/api` to backend.

Build for production (frontend only):

```powershell
npm run build
```

To run the backend on its own (production or local):

```powershell
cd backend; npm start
```


## Notes, caveats and next steps

- SearXNG integration: `backend/routes/search.js` currently includes a secret and fallback logic that returns mocked results when the SearXNG instance returns HTML or is not configured for JSON API access. For production, ensure the SearXNG instance is configured with an API/secret and the secret is provided securely via environment variables.
- Authentication: the server references Clerk-based middleware in routes; ensure `CLERK_SECRET_KEY` and frontend `VITE_CLERK_PUBLISHABLE_KEY` are set when using protected endpoints.
- Database initialization: on server start `initializeDatabase()` will attempt to create tables and default service records. If you use managed MySQL, make sure the user has permission to create tables.
- Security: secrets in files (like the example SearXNG secret in `backend/routes/search.js`) should be moved into environment variables before production deployment.


If you'd like, I can:

- Expand the README with an architecture diagram and sequence flows for search/translation/chat operations.
- Extract environment variable usage to a single `backend/.env.example` and remove any hard-coded secrets from the code.
- Add small local tests (unit or integration) to validate core API endpoints.

Thank you — let me know which follow-up you'd like next.
