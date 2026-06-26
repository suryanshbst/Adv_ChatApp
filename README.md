# AdvChat App

A real-time chat application built with a modern full-stack architecture. Users can create and join rooms using unique 5-digit codes, exchange messages in real time via WebSockets, and persist chat history in PostgreSQL. Every new user joining a room receives the last 50 messages automatically.

---

## Features

- **Real-time messaging** — WebSocket-powered instant message delivery across all room members
- **Room management** — Create rooms with auto-generated 5-digit codes or join existing ones
- **Persistent chat history** — Messages stored in PostgreSQL; last 50 fetched on join
- **JWT authentication** — Secure signup/signin with bcrypt-hashed passwords
- **Admin controls** — Room creators can delete rooms; cascades all messages automatically
- **Responsive UI** — Dark-themed interface built with Tailwind CSS and Framer Motion
- **Auto-deployment** — Push to `main` triggers automatic deployment to AWS EC2 via GitHub Actions

---

## Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│                                                             │
│  ┌─────────────┐     Browser/Postman     ┌─────────────┐    │
│  │   Next.js   │ ←─────────────────────→ │    ALB      │    │
│  │   Frontend  │      HTTP / WebSocket   │   (Nginx)   │    │
│  │   Port 3000 │                         │   Port 80   │    │
│  └─────────────┘                         └──────┬──────┘    │
│                                                  │          │
└──────────────────────────────────────────────────┼──────────┘
                                                   │
                              ┌────────────────────┼────────────────────┐
                              │                    │                    │
                              ▼                    ▼                    ▼
                    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
                    │  HTTP Backend   │   │   WS Server     │   │   PostgreSQL    │
                    │  Express 5      │   │  WebSocket      │   │   Database      │
                    │  Port 3002      │   │  Port 8080      │   │   Port 5432     │
                    │                 │   │                 │   │                 │
                    │ • Auth routes   │   │ • Real-time     │   │ • Users         │
                    │ • Room CRUD     │   │   messaging     │   │ • Rooms         │
                    │ • JWT tokens    │   │ • Room mgmt     │   │ • Messages      │
                    │ • Prisma ORM    │   │ • Broadcast     │   │ • _RoomsToUser  │
                    └────────┬────────┘   └─────────────────┘   └─────────────────┘
                             │
                             └──────────────────────────────────────────────┐
                                                                            │
                              ┌─────────────────────────────────────────────▼─────┐
                              │              SHARED PACKAGES                       │
                              │                                                    │
                              │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐   │
                              │  │  @repo/db   │  │ @repo/common│  │  @repo/ui │   │ 
                              │  │  Prisma     │  │  Zod schemas│  │  React    │   │
                              │  │  Client     │  │  Validation │  │  Components│  │
                              │  └─────────────┘  └─────────────┘  └───────────┘   │
                              └────────────────────────────────────────────────────┘
```

---

## Monorepo Structure
```
Adv_ChatApp/
├── apps/
│   ├── http-backend/           # REST API (Express, Bun, port 3002)
│   │   ├── index.ts            # Entry point: Express app setup
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts   # JWT verification middleware
│   │   └── routes/
│   │       ├── authRouter.ts   # POST /signup, POST /signin
│   │       ├── roomRouter.ts   # POST /create, POST /join, GET /all, DELETE /:roomId
│   │       └── mainRouter.ts   # Route aggregation
│   │
│   ├── web/                    # Frontend (Next.js 16, React 19, port 3000)
│   │   ├── app/
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── signin/page.tsx # Login form
│   │   │   ├── signup/page.tsx # Registration form
│   │   │   ├── dashboard/page.tsx   # Room management UI
│   │   │   └── room/page.tsx   # Chat interface with WebSocket
│   │   ├── components/
│   │   │   └── ui/             # Reusable UI components
│   │   └── next.config.js      # Next.js configuration
│   │
│   └── ws-server/              # WebSocket server (ws library, Bun, port 8080)
│       ├── index.ts            # Entry point: WebSocketServer setup
│       ├── Connection/
│       │   └── index.ts        # WS message handlers (connect, joinRoom, message, leaveRoom)
│       ├── Room/
│       │   └── index.ts        # Room interface definition
│       └── User/
│           └── index.ts        # User interface definition
│
├── packages/
│   ├── db/                     # Shared Prisma client
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema (User, Rooms, Messages)
│   │   └── index.ts            # Prisma client export with dotenv
│   │
│   ├── common/                 # Shared validation schemas
│   │   └── index.ts            # Zod schemas (CreateUserSchema, SigninSchema, CreateRoomSchema)
│   │
│   └── ui/                     # Shared React components
│       ├── src/
│       │   ├── button.tsx      # Reusable Button component
│       │   ├── input.tsx       # Reusable Input component
│       │   └── card.tsx        # Card component
│       └── package.json
│
├── docker-compose.yml          # Multi-service Docker orchestration
├── nginx.conf                  # Reverse proxy configuration
├── dockerfile/                 # Service-specific Dockerfiles
│   ├── dockerfile.httpbackend  # HTTP backend container
│   ├── dockerfile.wsbackend    # WebSocket server container
│   └── dockerfile.frontend     # Next.js frontend container
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline for auto-deployment
├── turbo.json                  # Turborepo task configuration
├── package.json                # Root workspace configuration
└── .env                        # Environment variables (not committed)
```

---


---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion |
| HTTP Backend | Bun, Express 5, JWT, bcrypt, Zod |
| WebSocket Server | Bun, `ws` library |
| Database | PostgreSQL, Prisma ORM |
| Monorepo | Turborepo, Bun workspaces |
| Validation | Zod |
| UI Components | `@repo/ui` (shared package) |
| Deployment | Docker, Docker Compose, GitHub Actions, AWS EC2 |
| Reverse Proxy | nginx |

---


---

## Database Schema

| Model | Key Fields |
|-------|-----------|
| `User` | `id` (CUID), `email` (unique), `password` (hashed), `name` |
| `Rooms` | `id`, `slug` (unique), `admin` (userId) |
| `Messages` | `id`, `content`, `senderId`, `roomId`, `createdAt` |
| `_RoomsToUser` | Implicit many-to-many join table (Prisma) |

Relations:
- `User` ↔ `Rooms` (many-to-many via `_RoomsToUser`)
- `Rooms` → `Messages` (one-to-many, `onDelete: Cascade`)
- `User` → `Messages` (one-to-many, `onDelete: Cascade`)

---

## Getting Started

### Prerequisites

- Bun >= 1.1
- PostgreSQL database (or Docker)

### Environment Variables

Create a `.env` file in the repo root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/chatapp"
JWT_SECRET="your_jwt_secret"

NEXT_PUBLIC_HTTP_BACKEND=http://localhost:3002
NEXT_PUBLIC_WS_BACKEND=ws://localhost:8080
```
---

## Docker Deployment
```
docker-compose up --build -d
```

---

## Deployment Architecture
```
Developer Push
      │
      ▼
┌─────────────┐
│ GitHub Repo │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ GitHub Actions  │
│   (SSH to EC2)  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   AWS EC2       │
│ Ubuntu + Docker │
│                 │
│ docker-compose  │
│   up --build    │
└─────────────────┘
       │
       ▼
    Live Site
```

---

## License
MIT
```
```
