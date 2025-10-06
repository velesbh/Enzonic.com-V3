# Enzonic Backend API

This backend provides API endpoints for managing translation history with MySQL database integration and Clerk authentication.

## Features

- **Translation History**: Save and retrieve the last 5 translations per user
- **MySQL Database**: Stores translation data with automatic table creation
- **Clerk Authentication**: Secure API endpoints with user authentication
- **CORS Support**: Enabled for frontend integration

## Database Configuration

The backend connects to a MySQL database with the following configuration:
- Host: 167.160.184.181
- Port: 3306
- Database: casaos
- User: casaos
- Password: casaos

## API Endpoints

### Health Check
- **GET** `/health` - Server health status

### Translation History (Authenticated)
- **POST** `/api/translations` - Save a new translation
- **GET** `/api/translations/history` - Get user's translation history

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. For development with auto-reload:
```bash
npm run dev
```

## Environment Variables

The backend reads configuration from the parent `.env` file:
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `CLERK_SECRET_KEY` - Clerk authentication secret

## Database Schema

### translation_history

| Field | Type | Description |
|-------|------|-------------|
| id | INT AUTO_INCREMENT | Primary key |
| user_id | VARCHAR(255) | Clerk user ID |
| source_text | TEXT | Original text |
| translated_text | TEXT | Translated text |
| source_language | VARCHAR(10) | Source language code |
| target_language | VARCHAR(10) | Target language code |
| created_at | TIMESTAMP | Creation timestamp |

## Security

- All translation endpoints require valid Clerk authentication tokens
- CORS is configured for specific frontend origins
- Database connections use connection pooling for performance