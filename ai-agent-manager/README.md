# AI Agent Manager

A modern, full-stack platform for managing and orchestrating AI agents. Built with Next.js 15, TypeScript, Prisma, and NextAuth.js.

## Overview

AI Agent Manager helps knowledge workers leverage autonomous AI agents to enhance their productivity. The platform provides a comprehensive suite of features for creating, managing, and monitoring AI agents with built-in task management, conversation tracking, and analytics.

### Key Features

- **Agent Management**: Create and configure AI agents with custom prompts, tools, and behaviors
- **Multi-Agent Orchestration**: Coordinate multiple agents working together on complex tasks
- **Task & Project Management**: Kanban board for tracking agent work and human tasks
- **Real-time Conversations**: Interactive chat interface with AI agents
- **Authentication**: Secure user authentication with NextAuth.js (credentials, Google, GitHub)
- **Analytics & Monitoring**: Track agent performance, resource usage, and outcomes
- **Dark Mode**: Beautiful light and dark themes
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices

## Tech Stack

### Frontend
- **Next.js 15+** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Production database
- **NextAuth.js** - Authentication solution

### Infrastructure
- **Docker** - Containerized PostgreSQL
- **GitHub Actions** - CI/CD pipelines

## Getting Started

### Prerequisites

- Node.js 22.12+ (or 20.19+)
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-agent-manager.git
   cd ai-agent-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - Database URL (default works with Docker setup)
   - NextAuth secret (generate with: `openssl rand -base64 32`)
   - OAuth credentials (optional for Google/GitHub login)

4. Start the PostgreSQL database:
   ```bash
   docker-compose up -d
   ```

5. Initialize the database:
   ```bash
   npm run db:push
   npm run db:seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

### Default Credentials

After seeding, you can log in with:
- **Admin**: admin@example.com / admin123
- **User**: user@example.com / user123

## Project Structure

```
ai-agent-manager/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Protected dashboard pages
│   ├── api/                 # API routes
│   └── layout.tsx           # Root layout
├── components/
│   ├── layout/              # Layout components (Header, Sidebar, Footer)
│   ├── ui/                  # shadcn/ui components
│   └── theme-provider.tsx   # Theme configuration
├── lib/
│   ├── db.ts               # Prisma client
│   └── utils.ts            # Utility functions
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data
├── types/                  # TypeScript type definitions
└── public/                 # Static assets
```

## Database Schema

The application uses a comprehensive database schema:

- **Users**: User accounts with role-based access control
- **Agents**: AI agent configurations and status
- **Projects**: Group related agents and tasks
- **Tasks**: Kanban-style task management
- **Conversations**: Agent-user chat history
- **AuditLogs**: Security and activity tracking

See `prisma/schema.prisma` for the complete schema.

## Development

### Available Scripts

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint

# Database commands
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:migrate    # Create migration
npm run db:seed       # Seed database with sample data
npm run db:studio     # Open Prisma Studio
```

### Adding shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

### Environment Variables

Required environment variables:

```env
DATABASE_URL=              # PostgreSQL connection string
NEXTAUTH_URL=             # Application URL
NEXTAUTH_SECRET=          # Secret for JWT signing
GOOGLE_CLIENT_ID=         # Optional: Google OAuth
GOOGLE_CLIENT_SECRET=     # Optional: Google OAuth
GITHUB_CLIENT_ID=         # Optional: GitHub OAuth
GITHUB_CLIENT_SECRET=     # Optional: GitHub OAuth
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Configure environment variables
4. Set up PostgreSQL database (Vercel Postgres or external)
5. Deploy

### Docker

Build and run with Docker:

```bash
docker build -t ai-agent-manager .
docker run -p 3000:3000 ai-agent-manager
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Roadmap

### Phase 1: Foundation ✅
- [x] Project setup
- [x] Database schema
- [x] Authentication
- [x] Base UI components

### Phase 2: Core Features (In Progress)
- [ ] Agent CRUD operations
- [ ] Agent execution engine
- [ ] Conversation interface
- [ ] Task management

### Phase 3: Advanced Features
- [ ] Multi-agent orchestration
- [ ] Tool integrations
- [ ] Real-time updates
- [ ] Analytics dashboard

### Phase 4: Production Ready
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] Security audit

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Documentation: [docs.example.com](https://docs.example.com)
- Issues: [GitHub Issues](https://github.com/yourusername/ai-agent-manager/issues)
- Discord: [Join our community](https://discord.gg/example)

## Acknowledgments

Built with inspiration from:
- OpenClaw - Open-source autonomous AI agents
- Claude Code - Anthropic's coding assistant
- OpenAI Frontier - Enterprise AI platform
- LangChain/LangGraph - AI orchestration framework
