# Health Tech

A modern healthcare application built with React, TypeScript, and Vite, featuring a clean and responsive UI powered by Tailwind CSS and Radix UI components.

## 🚀 Features

- **Modern Tech Stack**: Built with React 19, TypeScript, and Vite for blazing-fast development
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **UI Components**: Pre-built accessible components using Radix UI primitives
- **Type Safety**: Full TypeScript support with strict type checking
- **Routing**: Client-side routing with React Router DOM
- **Developer Experience**: Hot Module Replacement (HMR) and ESLint configuration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)

## 🛠️ Installation

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository-url>
   cd health-tech
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## 🏃 Running the Application

### Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

Create an optimized production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

## 📁 Project Structure

```
health-tech/
├── public/              # Static assets
├── src/
│   ├── assets/         # Images, fonts, and other assets
│   ├── components/     # Reusable UI components
│   │   ├── ui/        # Shadcn UI components (Button, Card, Input, etc.)
│   ├── hooks/         # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.tsx
│   ├── lib/           # Utility functions
│   │   └── utils.ts
│   ├── pages/         # Page components
│   │   ├── home/
│   │   └── NotFound.tsx
│   ├── App.tsx        # Main application component
│   ├── App.css        # Application styles
│   ├── index.css      # Global styles and Tailwind directives
│   └── main.tsx       # Application entry point
├── index.html         # HTML template
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── vite.config.ts     # Vite configuration
└── tailwind.config.js # Tailwind CSS configuration
```

## 🎨 Tech Stack

### Core
- **React 19.2.0** - UI library
- **TypeScript 5.9.3** - Type-safe JavaScript
- **Vite 7.2.4** - Build tool and dev server

### Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **tailwindcss-animate** - Animation utilities
- **class-variance-authority** - Component variant management
- **clsx** & **tailwind-merge** - Conditional class management

### UI Components
- **Radix UI** - Accessible component primitives
  - `@radix-ui/react-slot`
  - `@radix-ui/react-toast`
- **Lucide React** - Icon library

### Routing
- **React Router DOM 7.13.0** - Client-side routing

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting rules
- **Autoprefixer** - CSS vendor prefixing
- **PostCSS** - CSS processing

## ⚙️ Configuration

### Path Aliases

The project uses `@` as an alias for the `src` directory:

```typescript
import { Button } from "@/components/ui/button"
```

### TypeScript Configuration

- **Strict mode** enabled for maximum type safety
- **verbatimModuleSyntax** for explicit type imports
- **Module resolution** set to "bundler" for Vite compatibility

### Vite Configuration

- **Dev server port**: 3000
- **Path alias**: `@` → `./src`
- **React plugin** with Fast Refresh

## 🧩 Available Components

The project includes pre-built UI components from Shadcn UI:

- **Button** - Customizable button component
- **Card** - Card container with header and content sections
- **Input** - Form input field
- **Textarea** - Multi-line text input
- **Toast** - Notification system

## 🔧 Customization

### Adding New Components

To add new Shadcn UI components:

```bash
npx shadcn@latest add <component-name>
```

### Tailwind Configuration

Customize your theme in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      // Your custom theme extensions
    }
  }
}
```

## 📝 ESLint Configuration

The project uses a modern ESLint flat config. To enable type-aware lint rules for production:

```javascript
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      // or tseslint.configs.strictTypeChecked for stricter rules
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and not licensed for public use.

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can change it in `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3001, // Change to your preferred port
  },
})
```

### Module Resolution Issues

If you encounter module resolution issues, ensure:
1. Dependencies are installed: `npm install`
2. TypeScript paths are configured correctly in `tsconfig.app.json`
3. Vite alias matches TypeScript paths in `vite.config.ts`

### Type Errors with Imports

When using `verbatimModuleSyntax`, ensure type-only imports use the `type` keyword:

```typescript
import type { SomeType } from './types'
```

## 📞 Support

For issues and questions, please open an issue in the repository.

---

**Built with ❤️ using React + TypeScript + Vite**
