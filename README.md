# 🎯 InvoLuck Backend

> Professional invoice management system backend built with TypeScript, Express,
> and MongoDB.

## 📋 Overview

InvoLuck Backend is a robust, scalable REST API designed for invoice management
and client billing. Built with modern technologies and best practices, it
provides a solid foundation for invoice generation, client management, and
payment tracking.

## 🚀 Features

- **🔐 Authentication & Authorization**: JWT-based auth with role management
- **👥 Client Management**: Complete CRUD operations for client data
- **📄 Invoice System**: Create, manage, and track invoices with automatic
  calculations
- **📧 Email Integration**: Maizzle-powered email templates with Nodemailer
- **🛡️ Security**: Helmet, CORS, rate limiting, and data sanitization
- **📊 Analytics**: User and business statistics
- **🧪 Testing**: Comprehensive test suite with Jest and Supertest
- **📝 Logging**: Structured logging with Pino
- **🔍 Validation**: Input validation with Zod schemas
- **📱 API Documentation**: OpenAPI/Swagger documentation

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **Email**: Nodemailer + Maizzle templates
- **Logging**: Pino
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint + Prettier + Husky
- **Documentation**: OpenAPI 3.0

## 📦 Installation

### Prerequisites

- Node.js 18.18.0 or higher
- MongoDB 5.0 or higher
- npm or yarn package manager

### Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd involuck-backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit environment variables
nano .env  # or your preferred editor
```

### Environment Configuration

Update the `.env` file with your configuration:

```env
# Application
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/involuck

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Email (SMTP)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM="InvoLuck <no-reply@involuck.dev>"
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
# Start development server with hot reload
npm run dev

# Server will be available at http://localhost:5000
```

### Production Mode

```bash
# Build the application
npm run build

# Compile email templates
npm run email:build

# Start production server
npm run start
```

### Email Development

```bash
# Start Maizzle development server
npm run email:dev

# Build email templates for production
npm run email:build
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api/v1
```

### Main Endpoints

#### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile
- `PATCH /auth/profile` - Update user profile
- `POST /auth/logout` - User logout

#### Clients

- `GET /clients` - List clients (paginated)
- `POST /clients` - Create new client
- `GET /clients/:id` - Get client by ID
- `PATCH /clients/:id` - Update client
- `DELETE /clients/:id` - Delete client
- `GET /clients/search` - Search clients
- `GET /clients/stats` - Client statistics

#### Invoices

- `GET /invoices` - List invoices (paginated)
- `POST /invoices` - Create new invoice
- `GET /invoices/:id` - Get invoice by ID
- `PATCH /invoices/:id` - Update invoice
- `DELETE /invoices/:id` - Delete invoice
- `POST /invoices/:id/send` - Send invoice via email
- `PATCH /invoices/:id/status` - Update invoice status

#### Health

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system health
- `GET /health/ping` - Simple ping endpoint

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "requestId": "uuid-v4",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "pagination": { ... } // For paginated responses
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": [ ... ] // Optional validation details
  },
  "requestId": "uuid-v4",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📁 Project Structure

```
involuck-backend/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── server.ts              # Server entry point
│   ├── config/                # Configuration files
│   │   ├── env.ts             # Environment validation
│   │   ├── db.ts              # Database connection
│   │   ├── logger.ts          # Logging configuration
│   │   ├── cors.ts            # CORS configuration
│   │   ├── rateLimit.ts       # Rate limiting
│   │   └── mail.ts            # Email configuration
│   ├── middlewares/           # Express middlewares
│   │   ├── requestId.ts       # Request ID generation
│   │   ├── auth.ts            # Authentication middleware
│   │   ├── validate.ts        # Validation middleware
│   │   ├── error.ts           # Error handling
│   │   └── notFound.ts        # 404 handler
│   ├── utils/                 # Utility functions
│   │   ├── ApiError.ts        # Custom error classes
│   │   ├── asyncHandler.ts    # Async error wrapper
│   │   ├── http.ts            # HTTP response helpers
│   │   ├── pagination.ts      # Pagination utilities
│   │   └── sanitize.ts        # Data sanitization
│   ├── validators/            # Zod validation schemas
│   │   ├── auth.schema.ts     # Auth validation
│   │   ├── client.schema.ts   # Client validation
│   │   └── invoice.schema.ts  # Invoice validation
│   ├── models/                # Mongoose models
│   │   ├── User.ts            # User model
│   │   ├── Client.ts          # Client model
│   │   └── Invoice.ts         # Invoice model
│   ├── services/              # Business logic
│   │   ├── auth.service.ts    # Authentication service
│   │   ├── clients.service.ts # Client service
│   │   ├── invoices.service.ts# Invoice service
│   │   ├── mail.service.ts    # Email service
│   │   └── pdf.service.ts     # PDF service (stub)
│   ├── controllers/           # Request handlers
│   │   ├── auth.controller.ts # Auth controller
│   │   ├── clients.controller.ts # Client controller
│   │   └── invoices.controller.ts # Invoice controller
│   ├── routes/                # Route definitions
│   │   ├── index.ts           # Main router
│   │   ├── auth.routes.ts     # Auth routes
│   │   ├── clients.routes.ts  # Client routes
│   │   ├── invoices.routes.ts # Invoice routes
│   │   └── health.routes.ts   # Health routes
│   ├── emails/                # Email system
│   │   ├── renderer.ts        # Template renderer
│   │   ├── types.ts           # Email types
│   │   ├── compiled/          # Compiled templates
│   │   └── maizzle/           # Maizzle configuration
│   ├── docs/                  # API documentation
│   ├── tests/                 # Test files
│   ├── seeders/               # Database seeders
│   └── types/                 # TypeScript type definitions
├── .github/workflows/         # GitHub Actions CI/CD
├── .husky/                    # Git hooks
├── .vscode/                   # VS Code configuration
└── [config files...]         # Various config files
```

## 🔧 Development

### Code Style

The project uses ESLint and Prettier for code formatting:

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Git Hooks

Husky is configured to run linting and formatting on pre-commit:

```bash
# Install git hooks
npm run prepare
```

### Database Seeding

```bash
# Seed database with sample data
npm run seed
```

## 🚢 Deployment

### Docker

```bash
# Build Docker image
docker build -t involuck-backend .

# Run with Docker Compose
docker-compose up -d
```

### Environment Variables for Production

Make sure to set these environment variables in production:

- `NODE_ENV=production`
- `JWT_SECRET` (secure random string)
- `MONGODB_URI` (production database)
- `SMTP_*` (production email service)

## 📝 Scripts Reference

| Script                | Description                              |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Start development server with hot reload |
| `npm run build`       | Build TypeScript to JavaScript           |
| `npm run start`       | Start production server                  |
| `npm test`            | Run test suite                           |
| `npm run lint`        | Lint code with ESLint                    |
| `npm run format`      | Format code with Prettier                |
| `npm run email:dev`   | Start Maizzle development server         |
| `npm run email:build` | Build email templates                    |
| `npm run seed`        | Seed database with sample data           |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [API documentation](http://localhost:5000/api/v1/docs)
2. Review the test files for usage examples
3. Open an issue in the repository

## 🔮 Roadmap

- [ ] Payment gateway integration
- [ ] Advanced reporting and analytics
- [ ] Multi-currency support enhancement
- [ ] Invoice templates customization
- [ ] Webhook notifications
- [ ] API rate limiting improvements
- [ ] Advanced search and filtering
- [ ] Bulk operations support

---

**Built with ❤️ for the InvoLuck project**
