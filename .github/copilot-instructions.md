# CIS Support Pro - AI Coding Instructions

## Project Overview
**CIS Support Pro** is a modern IT help desk portal built with Next.js 15, Tailwind CSS, and Supabase. It replaces traditional ticketing systems with a clean, Apple-style command center that processes support emails via AI triage, enables real-time collaboration, and provides analytics dashboards.

## Architecture & Data Flows

### Core System Components
1. **Email Pipeline**: Gmail API → LLM Triage (OpenAI) → Supabase → Dashboard
   - Endpoint: [app/api/cron/process-emails/route.ts](app/api/cron/process-emails/route.ts) (runs via scheduled cron, protected by `CRON_SECRET`)
   - Modules: [lib/gmail/fetch-emails.ts](lib/gmail/fetch-emails.ts), [lib/triage/llm-triage.ts](lib/triage/llm-triage.ts)
   - Flow: Fetches unread → Checks duplicates → LLM classifies (support/junk) → Creates tickets or adds to trash

2. **Real-time Subscriptions**: Supabase postgres_changes trigger UI updates
   - Example: [components/ticket-detail.tsx](components/ticket-detail.tsx#L46) subscribes to ticket table changes
   - Used for live dashboard updates and multi-user sync

3. **Authentication & Authorization**: Supabase Auth → Middleware → Role-based Access Control (RLS policies)
   - [middleware.ts](middleware.ts): Session renewal via `updateSession` helper
   - Roles: `supervisor` (full access) vs `technician` (can only update assigned tickets)
   - Check role in server actions before mutations (see [app/actions/update-ticket-status.ts](app/actions/update-ticket-status.ts#L28-L31))

### Database Schema Highlights
- **Tickets**: `status` (open|in_progress|pending|resolved|closed), `priority`, `category`, `assigned_to` (foreign key)
- **Activity Log**: JSONB `details` for audit trail (used for ticket activity sidebar)
- **Trash**: Junk emails separated for review
- RLS policies enforce: users read all users, technicians only see/modify assigned tickets

## Development Workflow

### Essential Commands
```bash
npm run dev           # Start dev server (localhost:3000)
npm run build        # Production build (runs type check)
npm run type-check   # TypeScript validation only
npm run lint         # ESLint (Next.js strict rules)
```

### Environment Setup
Copy `.env.local.example` to `.env.local` with:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for server-side operations)
- `OPENAI_API_KEY` (for email triage)
- `GMAIL_*` credentials (service account for email fetching)
- `CRON_SECRET` (authorization header for scheduled jobs)

### Running Migrations
Apply in Supabase SQL Editor (sequential order):
1. `001_initial_schema.sql` - Base tables + RLS policies
2. `002_notifications.sql` - Notification system
3. `003_email_integration.sql` - Gmail integration tables
4. `004_ticket_workflow.sql` - Workflow state machine

## Key Patterns & Conventions

### Server Actions Pattern
All ticket mutations use "use server" server actions in `/app/actions/`:
- Always validate user auth: `const { data: { user } } = await supabase.auth.getUser()`
- Enforce role permissions before mutations
- Return `{ error: string }` on failure, null on success
- Call `revalidatePath("/dashboard")` to refresh UI
- Example: [app/actions/accept-ticket.ts](app/actions/accept-ticket.ts)

### Component Organization
- **UI components**: [components/ui/](components/ui/) (Shadcn/UI - button, card, dialog, etc.)
- **Feature components**: [components/](components/) root (ticket-list, sidebar, settings pages)
- **Client components** use `"use client"` directive; fetch via server actions
- Use hooks: `useToast()` for notifications, `useState` + `useEffect` for local state

### Type Definitions
Central source: [lib/types.ts](lib/types.ts)
- `Ticket`, `User`, `Note`, `TriageResult`, `ActivityLog`
- Use these types in all components; avoid inline `any` types
- Priority/Status/Category use string literals (not enums) for database compatibility

### Styling Approach
- Tailwind CSS with CSS variables for theming (light/dark)
- Theme colors in [app/globals.css](app/globals.css) (e.g., `--primary`, `--destructive`)
- Use `clsx` for conditional classes, `tailwind-merge` for overrides
- Dark mode via `ThemeProvider` (next-themes) with class strategy

### Email & LLM Integration
- **Triage**: [lib/triage/llm-triage.ts](lib/triage/llm-triage.ts) uses GPT-4o-mini with strict JSON schema
- Always parse LLM response as JSON; log errors if parsing fails
- Categories from email body analysis: hardware|software|network|access|email|other
- Confidence scoring used for junk filtering (typically threshold > 0.7)

## Testing & Validation

### Pre-commit Checks
- `npm run type-check` - Catches TypeScript errors before runtime
- `npm run lint` - Next.js ESLint config enforces strict rules

### Local Testing
- Use mock data in [lib/mock-data.ts](lib/mock-data.ts) for dashboard UI testing
- For email pipeline: manually test via API route `/api/cron/process-emails?debug=true` (if implemented)
- Real-time subscriptions tested by opening dashboard in 2 tabs, editing ticket in one

### Common Issues
- **Supabase RLS blocking queries**: Check user role in RLS policies before querying
- **Type mismatches**: Ensure component props match [lib/types.ts](lib/types.ts) definitions
- **Email duplicates**: `processed_emails` table tracks `message_id`; always check before inserting

## File Structure Map

```
app/
  actions/          # Server actions (mutations + data fetching)
  api/cron/         # Scheduled job for email processing
  dashboard/        # Main ticket list view
  auth/             # Auth pages (login/callback)
  settings/         # User preferences
components/
  ui/               # Shadcn/UI primitives
  ticket-*.tsx      # Ticket-specific features
  analytics/        # Chart components
  settings/         # Settings panels
lib/
  supabase/         # Client/server/middleware wrappers
  triage/           # LLM classification logic
  gmail/            # Gmail API integration
  types.ts          # Centralized type definitions
supabase/
  migrations/       # SQL DDL (order-dependent)
```

## Integration Points

### Supabase Client Distinction
- **Browser**: `lib/supabase/client.ts` (anon key, client-side queries)
- **Server**: `lib/supabase/server.ts` (anon + service role, cookie-based auth)
- Always use server client in server actions; browser client in client components

### Gmail API
- Uses service account (not OAuth) for reliable scheduled fetching
- [lib/gmail/client.ts](lib/gmail/client.ts) wraps googleapis library
- Marks emails as read + archives after processing to avoid re-fetching

### OpenAI Integration
- Model: `gpt-4o-mini` (cost-optimized)
- Always request JSON response with schema in prompt (see [lib/triage/llm-triage.ts](lib/triage/llm-triage.ts#L14-L34))
- Fallback to "other" category if parsing fails

## Common Task Checklist

When adding features:
- [ ] Define types in [lib/types.ts](lib/types.ts) if new entities
- [ ] Create server actions in `app/actions/` for mutations (include auth checks)
- [ ] Add RLS policies in migrations if new tables
- [ ] Use Shadcn/UI components from [components/ui/](components/ui/) (don't build custom buttons)
- [ ] Use Tailwind + CSS vars for styling
- [ ] Set up real-time subscription if data changes in UI (model after [ticket-detail.tsx](components/ticket-detail.tsx#L46))
- [ ] Test with `npm run type-check` before committing
