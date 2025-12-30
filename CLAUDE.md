# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Library Management System built with Next.js 16, React 19, TypeScript, Supabase, TailwindCSS 4, and shadcn/ui components.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm start         # Start production server
npm run lint      # Run ESLint

# Local Supabase development
npx supabase start   # Start local Supabase instance
npx supabase stop    # Stop local Supabase instance
```

## Architecture

### Tech Stack
- **Frontend:** Next.js 16 App Router, React 19, TypeScript, TailwindCSS 4, shadcn/ui (Radix UI)
- **Backend:** Supabase (PostgreSQL, Auth, RLS policies, stored procedures)
- **Forms:** React Hook Form + Zod validation
- **State:** React Context (AuthContext for global auth state)

### Key Directories
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/auth/register/  # Server-side user registration endpoint
│   ├── books/              # Book catalog and detail pages
│   └── dashboard/          # User dashboard
├── components/
│   ├── books/              # BookCard, SearchFilters
│   ├── layout/             # Header, Footer
│   └── ui/                 # shadcn/ui components
├── contexts/               # AuthContext for auth state
├── lib/                    # Supabase client, utilities
└── types/                  # TypeScript types (book, user, supabase)

supabase/
└── migrations/             # Database schema and RLS policies
```

### Database Schema
- **users** - User profiles linked to Supabase Auth
- **books** - Book catalog with availability tracking
- **categories** - Book classification
- **loans** - Borrowing transactions (14-day loan period)
- **reservations** - Book reservations
- **reviews** - User book reviews

Key stored procedures: `borrow_book()`, `return_book()`, `reserve_book()`, `get_user_dashboard_stats()`

### Authentication Flow
1. User registers via `/register` → calls `/api/auth/register`
2. Server creates Supabase Auth user (auto-confirms email) and user profile in `users` table
3. Frontend auto-signs in and redirects to dashboard
4. AuthContext syncs auth state and user profile globally

### Data Flow
- Supabase client SDK called directly from React components (client-side)
- No separate API layer - queries go through `src/lib/supabase-client.ts`
- Row Level Security (RLS) policies enforce data access at database level

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key (for server-side operations)
```

## Path Alias

Use `@/*` to import from `./src/*` (configured in tsconfig.json)

## Notes

- Build config ignores TypeScript/ESLint errors (see `next.config.js`)
- Dark mode supported via TailwindCSS class strategy
- Some code comments are in Chinese
