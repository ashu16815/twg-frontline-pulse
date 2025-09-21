# TWG Frontline Pulse

A premium weekly store feedback system with Liquid Glass UI, built for The Warehouse Group. Store managers can submit their Top-3 weekly issues, which are then analyzed by AI and summarized for the CEO Office.

## ✨ Features

- **🎨 Liquid Glass UI**: Premium black theme with translucent surfaces and subtle animations
- **📝 Weekly Feedback**: Simple form for store managers to submit Top-3 issues
- **🤖 AI Analysis**: Azure OpenAI integration for issue analysis and theme extraction
- **👔 CEO Dashboard**: Executive summaries by region with interactive Q&A
- **📱 Responsive Design**: Works perfectly on all devices
- **🔐 Passcode Authentication**: Simple security for store access

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **Backend**: Next.js API routes (TypeScript)
- **Database**: Supabase Postgres with Row-Level Security
- **AI**: Azure OpenAI (GPT-5) for analysis and summaries
- **Deployment**: Vercel
- **Styling**: TailwindCSS with custom Liquid Glass theme

## 🛠️ Setup

### Prerequisites

- Node.js 18+ 
- Supabase account
- Azure OpenAI account

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_DEPLOYMENT_GPT5=gpt-5
AZURE_OPENAI_API_VERSION=2024-10-01-preview
APP_SHARED_PASSCODE=your_secure_passcode
```

### Installation

```bash
# Install dependencies
npm install

# Run database setup (requires service role key)
npm run db:push

# Seed demo data (requires service role key)
npm run seed

# Start development server
npm run dev
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── ceo/               # CEO dashboard
│   ├── weekly/submit/     # Store feedback form
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── Glass.tsx          # Glass UI components
│   ├── NavBar.tsx         # Navigation
│   └── ...
├── lib/                   # Utility libraries
│   ├── gpt5.ts           # Azure OpenAI integration
│   └── supabase-admin.ts  # Database client
└── db/                    # Database schema
    └── schema.sql         # SQL schema
```

## 🎨 Design System

The application uses a custom "Liquid Glass" design system:

- **Colors**: Deep black background (`#05070A`) with light text (`#E6EDF3`)
- **Effects**: Translucent surfaces with backdrop blur
- **Animations**: Subtle sheen effects and hover transitions
- **Typography**: Clean, modern fonts with proper hierarchy

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📊 Database Schema

The application uses three main tables:

- `store_feedback`: Weekly submissions from stores
- `weekly_summary`: AI-generated regional summaries  
- `audit_log`: System activity tracking

## 🔧 Development

```bash
# Run development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

## 📝 License

Built for The Warehouse Group. All rights reserved.

## 🤝 Contributing

This is an internal project for The Warehouse Group. For questions or issues, please contact the development team.