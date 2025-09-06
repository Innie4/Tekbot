# TekBot Platform

A multi-tenant AI assistant engine that starts as TekAssist (internal bot for Tekskillz) and expands to serve SMBs, initially targeting Salons & Barbers in the USA.

## 🚀 Project Overview

TekBot is a comprehensive SaaS platform that provides AI-powered customer service automation with multi-tenant architecture. The platform supports various business verticals with customizable modules and integrations.

### Key Features
- **Multi-tenant Architecture**: Single database with tenant_id-based separation
- **AI-Powered Conversations**: OpenAI/GPT integration with intelligent prompt routing
- **Multi-Channel Communication**: WhatsApp, Instagram, Email integration
- **CRM Integration**: Customer management, leads, and tags
- **Appointment Scheduling**: Staff management and service catalog
- **Payment Processing**: Stripe (US) and Paystack (Nigeria) integration
- **Automated Campaigns**: Reminders and promotional campaigns

## 🏗️ Technical Architecture

### Stack
- **Frontend**: React-based web chat widget
- **Backend**: Node.js with NestJS framework
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis for job queues and reminders
- **AI**: OpenAI/GPT integration with prompt routing
- **Payment Processing**: Stripe (US) and Paystack (Nigeria)
- **Messaging**: WhatsApp/Instagram via Twilio/360Dialog + Meta API
- **Deployment**: Cloud-ready (AWS/Azure/GCP compatible)

### Core Modules
1. **CRM Module**: Customer management, leads, tags
2. **Appointments Module**: Scheduling, staff management, service catalog
3. **Payments Module**: Payment processing and link generation
4. **Messaging Module**: Multi-channel communication
5. **Campaigns Module**: Automated reminders and promotional campaigns
6. **AI Module**: LLM integration, prompt routing, intent classification
7. **Admin Module**: Tenant management, configuration, analytics

## 📁 Project Structure

```
tekbot-platform/
├── apps/                     # Applications
│   ├── backend/             # NestJS API server
│   ├── frontend/            # React chat widget
│   └── admin-dashboard/     # Admin management interface
├── packages/                # Shared packages
│   ├── shared/             # Shared utilities and types
│   ├── database/           # Prisma schema and migrations
│   └── ui-components/      # Reusable UI components
├── infrastructure/          # Infrastructure as code
├── docs/                   # Documentation
└── tools/                  # Development tools and scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tekbot-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the database**
   ```bash
   docker-compose up -d postgres redis
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

6. **Start the development servers**
   ```bash
   npm run dev
   ```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e
```

## 📚 Documentation

- [API Documentation](./docs/api/README.md)
- [Database Schema](./docs/database/README.md)
- [Deployment Guide](./docs/deployment/README.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)

## 🤝 Contributing

Please read our [Contributing Guide](./docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@tekskillz.com or join our Slack channel.