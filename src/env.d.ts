/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly CLERK_SECRET_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_OPENAI_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}