/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly CLERK_SECRET_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_OPENAI_API_URL: string
  readonly VITE_API_URL: string
  // S3/MinIO Configuration
  readonly S3_ENDPOINT: string
  readonly S3_ACCESS_KEY: string
  readonly S3_SECRET_KEY: string
  readonly S3_BUCKET: string
  readonly S3_REGION: string
  // SMTP Configuration
  readonly SMTP_HOST: string
  readonly SMTP_PORT: string
  readonly SMTP_USER: string
  readonly SMTP_PASS: string
  readonly SMTP_FROM: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}