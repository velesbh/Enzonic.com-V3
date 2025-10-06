# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/9b9de450-ad6c-4882-8fae-804239f23a83

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9b9de450-ad6c-4882-8fae-804239f23a83) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up environment variables.
cp .env.example .env
# Edit .env file with your actual API keys

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Environment Setup

This project requires environment variables for API authentication. Copy the `.env.example` file to `.env` and fill in your actual API keys:

```sh
cp .env.example .env
```

Required environment variables:

- `VITE_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key for authentication (client-side)
- `CLERK_SECRET_KEY` - Your Clerk secret key for server-side operations (backend only)
- `VITE_OPENAI_API_KEY` - Your OpenAI compatible API key for translation services
- `VITE_OPENAI_API_URL` - The API endpoint URL (defaults to Enzonic's endpoint)
- `VITE_API_URL` - Backend API URL (defaults to http://localhost:3001)

### Database Configuration (MySQL)

The backend requires a MySQL database for translation history:

- `DB_HOST` - Database host (167.160.184.181)
- `DB_PORT` - Database port (3306)
- `DB_NAME` - Database name (casaos)
- `DB_USER` - Database username (casaos)
- `DB_PASSWORD` - Database password (casaos)

## Running the Full Application

To run both frontend and backend together on a single port:

```sh
npm run dev
```

This will start:
- Backend server on port 3001
- Frontend development server on port 8080 
- Automatic proxy configuration routes `/api/*` calls to the backend

The application will be available at http://localhost:8080

### Alternative Commands

If you need to run components separately:

- **Frontend only:** `npm run dev:frontend`
- **Backend only:** `npm run backend:start`

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Clerk (Authentication with automatic theme matching)

## Features

- 🎨 **Automatic theme detection** - Follows your system's dark/light mode preference
- 🔐 **Secure authentication** - Powered by Clerk with theme-matched UI
- 🌐 **Multi-language support** - AI-powered translation service with history
- 📚 **Translation History** - Saves last 5 translations for signed-in users
- 💻 **Virtual machines** - Secure browser sessions with Boxes
- 🤖 **AI Discord bot** - Intelligent chat bot with memory
- 📱 **Responsive design** - Works perfectly on all devices
- 🗄️ **MySQL Database** - Persistent storage for user data

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9b9de450-ad6c-4882-8fae-804239f23a83) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
