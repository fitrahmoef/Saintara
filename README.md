# Saintara - Personality Assessment Platform

Saintara is a comprehensive personality assessment platform built with modern web technologies. It helps individuals discover their natural character traits and unlock their potential through scientifically-backed personality tests.

## 🎨 Color Theme

The platform uses a clean and professional color scheme:
- **Primary Yellow**: `#FEC53D`
- **Black**: `#000000`
- **White**: `#FFFFFF`

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: React Icons, AOS (Animate on Scroll)
- **Charts**: Chart.js & React-ChartJS-2

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: Helmet, bcryptjs, CORS

### Database
- **Database**: PostgreSQL
- **ORM**: Native pg driver

## 📁 Project Structure

```
Saintara/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App router pages
│   │   ├── page.tsx        # Landing page
│   │   ├── layout.tsx      # Root layout
│   │   ├── globals.css     # Global styles
│   │   ├── dashboard/      # User dashboard
│   │   └── admin/          # Admin dashboard
│   ├── components/          # Reusable components
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── backend/                 # Express.js backend API
│   ├── src/
│   │   ├── server.ts       # Main server file
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   └── routes/         # API routes
│   ├── database/           # Database schema & seeds
│   ├── package.json
│   └── tsconfig.json
│
└── README.md               # This file
```

## 🚀 Quick Start - Choose Your Database

### Option 1: Neon PostgreSQL (⭐ Recommended - Easiest!)
**Perfect for beginners and production. Setup in 5 minutes!**

📖 **[Follow NEON_EASY_SETUP.md](./NEON_EASY_SETUP.md)** for step-by-step guide

- ✅ Instant setup (2 minutes)
- ✅ Free tier: 3GB storage
- ✅ Zero management
- ✅ Perfect for Vercel
- ✅ Just paste connection string!

### Option 2: Supabase PostgreSQL
**Good if you need additional features like Auth, Storage, etc.**

📖 **[Follow SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** for detailed guide

- ✅ Free tier: 500MB
- ✅ Additional features (Auth, Storage, Realtime)
- ✅ SQL Editor built-in

### Option 3: Local PostgreSQL
**For development only**

📖 **[Follow SETUP.md](./SETUP.md)** for local development setup

```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE saintara;"

# Run schema migration
psql -U postgres -d saintara -f backend/database/schema.sql

# Run seed data
psql -U postgres -d saintara -f backend/database/seed.sql
```

## 💻 After Database Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Saintara
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your database credentials
# For Neon: See NEON_EASY_SETUP.md
# For Supabase: See SUPABASE_SETUP.md
```

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
```

### 5. Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (Protected)

### Users
- `GET /api/users/tests` - Get user tests (Protected)
- `GET /api/users/results` - Get user results (Protected)

### Tests
- `GET /api/tests` - Get all available tests
- `GET /api/tests/:id` - Get specific test
- `POST /api/tests` - Create new test (Protected)
- `POST /api/tests/:id/submit` - Submit test answers (Protected)

### Results
- `GET /api/results` - Get all user results (Protected)
- `GET /api/results/:id` - Get specific result (Protected)
- `GET /api/results/:id/pdf` - Download result as PDF (Protected)

### Admin (Requires admin role)
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats` - Get platform statistics

## 🎯 Features

### Public Features
- Landing page with platform information
- 9 character type explanations
- 35 personality insights overview
- Pricing packages (Personal, Couple, Team)
- FAQ section
- Testimonials

### User Dashboard
- Personal character profile
- Test results and insights
- Token purchase and management
- AI-powered character consultation
- Content recommendations
- Downloadable certificates
- Strengths and challenges overview

### Admin Dashboard
- Statistics overview
- Test distribution analytics
- Agent management
- Financial tracking
- Event/seminar management
- Approval workflow
- Team reports
- Attendance tracking

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- CORS protection
- Helmet.js for security headers
- Input validation with express-validator
- Role-based access control (RBAC)

## 📊 Database Schema

The platform includes comprehensive tables for:
- Users & authentication
- Character types (9 types)
- Tests & questions
- Test results & analysis
- Transactions & vouchers
- Agents & commissions
- Events & registrations
- Approval workflows

## 🎨 Design System

### Colors
- Primary: `#FEC53D` (Saintara Yellow)
- Secondary: `#000000` (Black)
- Background: `#FFFFFF` (White)
- Text: `#000000` (Black)
- Accents: Gradients from yellow to lighter shades

### Typography
- Headings: Poppins
- Body: Inter
- Responsive font sizes with Tailwind CSS

## 🛠️ Development

### Build Commands

**Frontend:**
```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

**Backend:**
```bash
npm run dev      # Development server with nodemon
npm run build    # Compile TypeScript
npm run start    # Start production server
```

## 📝 Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Backend (.env)
```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saintara
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 👥 Contact

For questions or support, contact: admin@saintara.com

---

Built with ❤️ by the Saintara Team
