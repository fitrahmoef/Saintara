# Saintara Backend API

Express.js backend for the Saintara personality assessment platform.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

#### Option A: Using Neon (Recommended for Production)

1. Create a Neon account at https://neon.tech
2. Create a new project and get your connection string
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Add your Neon connection string to `.env`:
   ```env
   DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
5. Run migrations:
   ```bash
   npm run db:setup
   ```

See **[NEON_SETUP.md](../NEON_SETUP.md)** for detailed instructions.

#### Option B: Using Local PostgreSQL

1. Install PostgreSQL locally
2. Create database:
   ```bash
   createdb saintara
   ```
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Update database credentials in `.env`
5. Run migrations:
   ```bash
   psql -U postgres -d saintara -f database/schema.sql
   psql -U postgres -d saintara -f database/seed.sql
   psql -U postgres -d saintara -f database/migrations/add_articles_table.sql
   psql -U postgres -d saintara -f database/migrations/add_password_reset_tokens.sql
   ```

### 3. Run Development Server

```bash
npm run dev
```

The server will start on http://localhost:5000

### 4. Test API

```bash
curl http://localhost:5000/health
```

## 📦 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run db:setup` - Run all database migrations (Neon or local)
- `npm run migrate:neon` - Alias for db:setup

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # Database connection
│   ├── controllers/              # Route controllers
│   │   ├── auth.controller.ts
│   │   ├── test.controller.ts
│   │   ├── result.controller.ts
│   │   ├── transaction.controller.ts
│   │   ├── voucher.controller.ts
│   │   ├── agent.controller.ts
│   │   ├── event.controller.ts
│   │   ├── approval.controller.ts
│   │   ├── article.controller.ts
│   │   └── admin.controller.ts
│   ├── middleware/
│   │   └── auth.middleware.ts   # JWT authentication
│   ├── routes/                   # API routes
│   └── server.ts                 # Express server setup
├── database/
│   ├── schema.sql                # Main database schema
│   ├── seed.sql                  # Initial data
│   └── migrations/               # Database migrations
├── scripts/
│   └── run-migrations.js         # Migration runner script
└── package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `PUT /api/auth/change-password` - Change password (protected)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Tests
- `GET /api/tests/questions` - Get all test questions
- `POST /api/tests` - Create new test (protected)
- `GET /api/tests/my-tests` - Get user's tests (protected)
- `POST /api/tests/:id/submit` - Submit test answers (protected)

### Results
- `GET /api/results` - Get all user results (protected)
- `GET /api/results/latest` - Get latest result (protected)
- `GET /api/results/:id` - Get specific result (protected)
- `GET /api/results/:id/pdf` - Download PDF certificate (protected)

### Transactions
- `POST /api/transactions` - Create transaction (protected)
- `GET /api/transactions` - Get user transactions (protected)
- `PUT /api/transactions/:id/payment-proof` - Upload payment proof (protected)
- `GET /api/transactions/admin/all` - Get all transactions (admin)
- `PUT /api/transactions/:id/status` - Update transaction status (admin)

### Vouchers
- `GET /api/vouchers` - Get user vouchers (protected)
- `POST /api/vouchers/use` - Use voucher code (protected)
- `POST /api/vouchers/create` - Create voucher (admin)
- `GET /api/vouchers/admin/all` - Get all vouchers (admin)

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event details
- `POST /api/events/:id/register` - Register for event (protected)
- `POST /api/events/create` - Create event (admin)
- `PUT /api/events/:id` - Update event (admin)
- `DELETE /api/events/:id` - Delete event (admin)

### Articles
- `GET /api/articles` - Get all articles
- `GET /api/articles/:id` - Get article by ID
- `GET /api/articles/featured` - Get featured articles
- `POST /api/articles` - Create article (admin)
- `PUT /api/articles/:id` - Update article (admin)
- `DELETE /api/articles/:id` - Delete article (admin)

### Admin
- `GET /api/admin/dashboard` - Get dashboard stats (admin)
- `GET /api/admin/users` - Get all users (admin)
- `GET /api/admin/users/:id` - Get user details (admin)

### Approvals
- `GET /api/approvals` - Get all approvals (admin)
- `GET /api/approvals/my-approvals` - Get user's approvals (protected)
- `POST /api/approvals` - Create approval request (protected)
- `PUT /api/approvals/:id/status` - Update approval status (admin)

### Agents
- `GET /api/agents` - Get all agents (admin)
- `POST /api/agents` - Create agent (admin)
- `GET /api/agents/:id` - Get agent details (admin)
- `POST /api/agents/sales` - Record agent sale (admin)

## 🔐 Environment Variables

See `.env.example` for all available environment variables.

**Required:**
- `DATABASE_URL` (for Neon) OR `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`
- `PORT`

**Optional:**
- `NODE_ENV` (default: development)
- `JWT_EXPIRES_IN` (default: 7d)
- `CORS_ORIGIN` (default: http://localhost:3000)

## 🛢️ Database

The application supports both:
- **Neon PostgreSQL** (serverless, recommended for production)
- **Local PostgreSQL** (for development)

The database config automatically uses `DATABASE_URL` if present, otherwise falls back to individual DB parameters.

### Database Tables

- `users` - User accounts
- `character_types` - 9 personality types
- `tests` - Test instances
- `test_questions` - Test questions
- `test_answers` - User answers
- `test_results` - Test results with analysis
- `transactions` - Payment transactions
- `vouchers` - Test tokens/vouchers
- `agents` - Sales agents
- `agent_sales` - Commission tracking
- `events` - Events/seminars
- `event_registrations` - Event attendees
- `approvals` - Admin approvals
- `articles` - Content articles
- `password_reset_tokens` - Password reset tokens

## 🔒 Security

- JWT-based authentication
- Password hashing with bcryptjs
- CORS protection
- Helmet.js security headers
- Input validation with express-validator
- Role-based access control (user, admin, agent)
- SSL/TLS for database connections (Neon)

## 📊 Monitoring

Health check endpoint: `GET /health`

Returns:
```json
{
  "status": "success",
  "message": "Server is healthy",
  "timestamp": "2025-01-02T12:00:00.000Z"
}
```

## 🚀 Deployment

### Recommended Platforms

1. **Railway** - Great for Node.js + PostgreSQL
2. **Render** - Free tier available
3. **Vercel** - Serverless functions
4. **Heroku** - Classic PaaS

### Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Set `DATABASE_URL` to your Neon connection string
- [ ] Update `CORS_ORIGIN` to your frontend URL
- [ ] Run migrations on production database
- [ ] Test all API endpoints
- [ ] Monitor error logs

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

Proprietary and confidential.
