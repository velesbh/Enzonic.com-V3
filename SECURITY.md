# Security Guide

## Environment Variables

This application uses environment variables to securely store sensitive information like API keys. Never commit actual API keys to version control.

### Setup

1. Copy `.env.example` to `.env`
2. Fill in your actual API keys in `.env`
3. The `.env` file is automatically ignored by git

### Required Variables

- `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key for authentication (client-side)
- `CLERK_SECRET_KEY`: Your Clerk secret key for server-side operations (backend only)
- `VITE_OPENAI_API_KEY`: Your OpenAI compatible API key for translation services
- `VITE_OPENAI_API_URL`: The API endpoint URL (optional, has default)

### Security Best Practices

1. **Never commit `.env` files** - The `.gitignore` file prevents this
2. **Use different keys for different environments** - Production, staging, development
3. **Rotate API keys regularly** - Especially if they may have been compromised
4. **Limit API key permissions** - Use keys with minimal required permissions
5. **Monitor API usage** - Watch for unexpected usage patterns

### Environment Variable Validation

The application validates that all required environment variables are present at startup. If any are missing, the application will throw an error with a clear message.

### Type Safety

TypeScript definitions are provided for all environment variables in `src/env.d.ts` to ensure type safety and autocomplete support.

## Deployment Considerations

When deploying to production:

1. Set environment variables in your deployment platform
2. Use secure secret management services when available
3. Never log environment variables containing sensitive data
4. Use HTTPS in production
5. Enable proper CORS settings

## API Security

- All API calls use HTTPS
- API keys are passed in headers, not URL parameters
- Client-side environment variables are prefixed with `VITE_` for Vite to expose them
- Sensitive operations should be moved to a backend service when possible