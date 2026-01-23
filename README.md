# CIS Support Pro

A modern, high-performance IT Help Desk portal built with Next.js 15, Tailwind CSS, Shadcn/UI, and Supabase. Designed to replace cluttered help desk systems with a clean, Apple-style "Command Center."

## Features

- ✨ **Modern UI**: Clean, Apple-style design with dark/light mode support
- 📊 **Dashboard**: Real-time view of active tickets with high-contrast status badges
- 🎯 **Smart Triage**: AI-powered email classification (Support vs Junk)
- 💬 **Internal Notes**: IT-only notes for ticket collaboration
- ⚡ **Real-time Updates**: Supabase real-time subscriptions for instant updates
- 📱 **Responsive**: Works seamlessly on desktop, tablet, and mobile

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v3
- **Components**: Shadcn/UI
- **Database**: Supabase (PostgreSQL + Real-time)
- **Language**: TypeScript
- **Font**: Inter (Google Fonts)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for database and real-time features)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   
   Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
   ```bash
   cp .env.local.example .env.local
   ```

   Update the following variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── dashboard/          # Main dashboard page
│   ├── analytics/          # Analytics page (placeholder)
│   ├── settings/           # Settings page (placeholder)
│   ├── trash/              # Filtered junk emails
│   ├── api/                # API routes (to be implemented)
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Root page (redirects to dashboard)
│   └── globals.css         # Global styles and theme variables
├── components/
│   ├── ui/                 # Shadcn/UI components
│   ├── sidebar.tsx         # Sidebar navigation
│   ├── ticket-list.tsx     # Ticket list table
│   ├── theme-provider.tsx  # Theme context provider
│   └── theme-toggle.tsx    # Dark/light mode toggle
├── lib/
│   ├── types.ts            # TypeScript type definitions
│   ├── utils.ts            # Utility functions
│   └── mock-data.ts        # Mock ticket data
└── supabase/
    └── migrations/         # Database migrations (to be created)
```

## Current Status

### ✅ Completed
- [x] Project setup with Next.js 15 and TypeScript
- [x] Tailwind CSS configuration
- [x] Shadcn/UI components (Button, Badge, Card, Input, Textarea, Table)
- [x] Dark/light mode theme system
- [x] Sidebar navigation with Apple-style design
- [x] Dashboard page with stats cards
- [x] Ticket list with status/priority badges
- [x] Mock data for development
- [x] Placeholder pages (Analytics, Settings, Trash)

### 🚧 In Progress / To Do
- [ ] Supabase database schema and migrations
- [ ] Real-time ticket subscriptions
- [ ] Ticket detail view (slide-over/modal)
- [ ] Internal notes functionality
- [ ] Email triage API route (`/api/inbound`)
- [ ] LLM integration for email classification
- [ ] Authentication and user management

## Database Schema

The following tables will be created in Supabase:

### `tickets`
- `id` (uuid, primary key)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `subject` (text)
- `body` (text)
- `sender_email` (text)
- `sender_name` (text, nullable)
- `status` (enum: open, pending, resolved, closed)
- `priority` (enum: low, medium, high, urgent)
- `category` (enum: hardware, software, network, access, other)
- `assigned_to` (text, nullable)

### `notes`
- `id` (uuid, primary key)
- `ticket_id` (uuid, foreign key → tickets.id)
- `content` (text)
- `author_name` (text)
- `created_at` (timestamp)

### `trash`
- `id` (uuid, primary key)
- `from` (text)
- `subject` (text)
- `body` (text)
- `received_at` (timestamp)
- `classification_reason` (text, nullable)

## API Routes

### `/api/inbound` (POST)
Receives incoming email JSON and classifies it as "Support Request" or "Junk" using LLM or keyword filtering.

**Request Body**:
```json
{
  "from": "user@example.com",
  "subject": "Email subject",
  "body": "Email body content",
  "received_at": "2026-01-21T18:00:00Z"
}
```

**Response**:
```json
{
  "classification": "support",
  "confidence": 0.95,
  "ticket_id": "uuid-here"
}
```

## Development

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Build
```bash
npm run build
```

## Contributing

This is an internal IT Help Desk project. For questions or suggestions, contact the IT team.

## License

Proprietary - Internal use only
