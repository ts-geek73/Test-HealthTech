# Session Management - Backend

The Express-based API layer for the Session Management System, integrated with Supabase.

## 🚀 Key Features

- **Dual Table Schema**: Decoupled `contents` (operational modules) and `sessions` (visit logs).
- **TypeScript Core**: Fully typed requests and responses.
- **Supabase Integration**: Native database handling via Supabase JS client.
- **Visit Tracking**: Dedicated endpoint for recording operational activity.

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Supabase](https://supabase.com/)

## 🏁 Getting Started

### 1. Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=4000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Local Development

```bash
npm install
npm run dev
```

The server will start on [http://localhost:4000](http://localhost:4000).

## 📡 API Endpoints

### Operational Modules (Contents)

- `GET /api/contents`: Retrieve all documentation modules.
- `GET /api/contents/:id`: Retrieve detailed info for a single unit.

### Activity Logs (Sessions)

- `GET /api/sessions`: Retrieve the complete activity log history.
- `POST /api/sessions/track`: Create a new tracking entry.

## 📂 Project Structure

- `src/index.ts`: Server entry point and middleware.
- `src/routes/`: Router definitions for contents and sessions.
- `src/lib/supabase.ts`: Supabase client initialization.
- `src/types/`: Shared TypeScript interfaces.
