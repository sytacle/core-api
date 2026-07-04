# App Store Platform API

Production-grade backend for a comprehensive app distribution and management platform. Built with NestJS, Prisma ORM, PostgreSQL, Redis, and OAuth 2.0/OpenID Connect.

## ✨ Features

- **🔐 Enterprise OAuth 2.0 / OpenID Connect** - Full authorization server with PKCE, token rotation, and introspection
- **📱 Publisher Management** - Multi-org support with role-based teams and verification
- **🎮 App Management** - Support for iOS, Android, and Web with rich metadata
- **🚀 Release Workflows** - Track-based releases (internal/alpha/beta/production) with approval and rollback
- **⭐ Reviews & Ratings** - Moderated reviews with helpful voting and reporting
- **💳 Billing & Subscriptions** - Flexible pricing, subscriptions, and invoice management
- **📊 Analytics** - Downloads, installs, crashes, and revenue by country/device
- **🛡️ Security** - CORS, rate limiting, input validation, audit logging, and more
- **🐳 Containerized** - Docker and Docker Compose ready

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    API Gateway                       │
│              (NestJS + Swagger/OpenAPI)              │
└───────────────────┬─────────────────────────────────┘
                    │
    ┌───────────────┼───────────────────┐
    │               │                   │
┌───▼──────┐  ┌────▼──────┐  ┌────────▼────┐
│ OAuth2.0 │  │  User &   │  │  Publisher  │
│  Server  │  │  Auth     │  │ & Apps      │
└──────────┘  └───────────┘  └─────────────┘
    │               │                │
    └───────────────┼────────────────┘
                    │
         ┌──────────▼────────────┐
         │   Prisma ORM +        │
         │  PostgreSQL Database  │
         └───────────────────────┘
         
         ┌───────────────────────┐
         │   Redis Cache &       │
         │   Session Store       │
         └───────────────────────┘
```

## 📋 Project Structure

```
src/
├── admin/           # Admin console APIs
├── apps/            # App management
├── auth/            # Auth & registration
├── oauth/           # OAuth 2.0 provider
├── prisma/          # Database service
├── publishers/      # Publisher accounts
├── releases/        # Release management
├── reviews/         # Reviews & ratings
├── uploads/         # File uploads
├── users/           # User profiles
├── app.module.ts    # Root module
└── main.ts          # Entry point
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Setup

```bash
# Clone and install
git clone <repo>
cd core-api
npm install

# Configure environment
cp .env.example .env

# Set up database
npx prisma migrate dev

# Start development server
npm run start:dev
```

Visit `http://localhost:5000/docs` for Swagger UI.

### Using Docker

```bash
docker-compose up

# In another terminal:
docker-compose exec app npx prisma migrate deploy
```

## 🔌 API Endpoints

### Core Auth
- `POST /v1/auth/register` - Register user
- `POST /v1/auth/login` - User login
- `POST /v1/oauth/token` - OAuth token exchange
- `POST /v1/oauth/revoke` - Token revocation
- `GET /v1/oauth/profile` - User profile

### Publishers
- `GET /v1/publishers` - List publisher accounts
- `POST /v1/publishers` - Create publisher
- `GET /v1/publishers/:id` - Get details
- `PATCH /v1/publishers/:id` - Update

### Apps
- `GET /v1/apps` - Browse apps
- `POST /v1/apps` - Create app
- `GET /v1/apps/:id` - App details
- `PATCH /v1/apps/:id` - Update metadata

### Releases
- `GET /v1/apps/:appId/releases` - List releases
- `POST /v1/apps/:appId/releases` - Create release
- `POST /v1/apps/:appId/releases/:id/publish` - Publish

### Reviews
- `GET /v1/apps/:appId/reviews` - List reviews
- `POST /v1/apps/:appId/reviews` - Submit review
- `PATCH /v1/reviews/:id` - Update review

### Analytics
- `GET /v1/analytics/apps/:appId` - App analytics
- `GET /v1/analytics/publishers/:publisherId` - Publisher dashboard

### Admin
- `GET /v1/admin/dashboard` - System stats
- `GET /v1/admin/users` - User management
- `GET /v1/admin/moderation` - Moderation queue

## 📦 Database

The Prisma schema includes:

**Core Models**
- User, Client, Session, RefreshToken, AccessToken
- Publisher, PublisherMember
- App, Release, AppReview
- Subscription, PaymentMethod, Invoice

**Analytics & Logging**
- AppAnalytics (time-series data)
- AuditLog (immutable action trail)

See [prisma/schema.prisma](prisma/schema.prisma) for the full schema.

## 🔐 Security

- **OAuth 2.0 / OIDC** compliance with PKCE
- **JWT** with rotation strategy
- **Rate limiting** via Throttler
- **Input validation** with class-validator
- **SQL injection** prevention via Prisma ORM
- **CORS** configuration
- **Audit logging** for sensitive actions
- **Helmet.js** security headers

## 🧪 Testing

```bash
# Unit tests
npm test

# Watch mode
npm test:watch

# Coverage
npm test:cov

# E2E tests
npm run test:e2e
```

## 🛠️ Development

```bash
# Start with watch mode
npm run start:dev

# Format code
npm run format

# Lint
npm run lint

# Build for production
npm run build
npm run start:prod
```

## 📚 Environment Variables

```env
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/appstore_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=3600

# Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 📖 Documentation

- **Swagger UI**: http://localhost:5000/docs
- **OpenAPI JSON**: http://localhost:5000/docs-json
- **Database**: [prisma/schema.prisma](prisma/schema.prisma)

## 🚢 Deployment

### Docker Build

```bash
docker build -t app-store-api .
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://... \
  app-store-api
```

### Kubernetes (Ready)

See [k8s/](k8s/) directory for deployment manifests.

## 🤝 Contributing

1. Create a feature branch
2. Make changes and commit
3. Run tests and linting
4. Submit a pull request

## 📊 Roadmap

- [ ] BullMQ job queue integration
- [ ] Advanced analytics & crash reports
- [ ] Push notifications
- [ ] Email templates
- [ ] Full-text search
- [ ] GraphQL API
- [ ] Prometheus metrics
- [ ] OpenTelemetry tracing

## 📄 License

Apache License 2.0

## 💬 Support

For issues or questions, please open an issue or contact the team.

---

**Built for scale, designed for security** 🚀
