# Session Management - Frontend

A clean, modular, and professional session management dashboard built with Next.js.

## 🚀 Key Features

- **Unified Control Dashboard**: Manage operational modules and monitor activity logs in a single view.
- **Professional Paper Aesthetic**: Minimalist design with high-quality typography and subtle shadows.
- **Smart Tracking Flow**:
  - **Conditional Linking**: Redundant tracking sessions are avoided by checking existing logs.
  - **URL Sanitization**: Tracking query parameters are automatically stripped from the URL after activation.
- **Modular Architecture**: Built with reusable sub-components (`DashboardSection`, `ContentGrid`, `ActivityLogTable`).
- **Standardized Iconography**: Powered by `react-icons`.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: React Icons (`hi2`, `md`)

## 🏁 Getting Started

### 1. Environment Configuration

Ensure you have a `.env.local` file with the following:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

### 2. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## 📂 Project Structure

- `src/app/page.tsx`: Unified Control Dashboard.
- `src/app/content/[id]/page.tsx`: Professional document view for specific operational units.
- `src/components/dashboard/`: Modular dashboard sub-components.
- `src/components/ui/`: Reusable primitive components (Shadcn).
