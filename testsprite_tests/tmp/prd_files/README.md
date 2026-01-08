# Converge - Centralized KYC Service for FinTech

[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)

## 📋 Problem Statement

In the modern FinTech ecosystem, users often need to complete KYC (Know Your Customer) verification separately for each lending platform they use. This creates friction, redundancy, and security concerns. **Converge** solves this by providing a **centralized KYC service** where:

- Users complete KYC verification **once**
- Third-party lenders (e.g., Slice) can verify KYC status securely
- Users maintain control over their data sharing
- Credit scores are calculated based on transaction history
- All identity documents are stored securely in one place

## 🎯 Key Features

### User Features
- ✅ **Secure Registration & Authentication** - JWT-based auth with RBAC
- 📁 **Document Management** - Upload multiple identity documents (Aadhaar, PAN, Passport, etc.)
- 🔄 **KYC Workflow** - Submit documents for admin review
- 📊 **Credit Score Tracking** - CIBIL-style scoring (300-900 range) based on transactions
- 💰 **Transaction History** - Track credits and debits with automatic score recalculation
- 🤝 **Partner Integration** - Link accounts with lending partners like Slice

### Admin Features
- 🔍 **Verification Queue** - Review pending KYC applications
- 📄 **Document Review** - View all uploaded documents for verification
- ✔️ **Approve/Reject** - Take action with mandatory rejection reasons
- 📈 **Audit Trail** - Complete history of all KYC reviews

### Partner Integration (Slice Simulation)
- 🔐 **OAuth-like Flow** - Secure account linking mechanism
- ✓ **KYC Status Check** - Verify if user KYC is approved
- 📊 **Data Retrieval** - Access credit scores and transaction history with user consent
- 🔑 **API Key Authentication** - Secure partner API access

## 🏗️ Architecture

### System Design

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Frontend │────────▶│  Express Backend│────────▶│   PostgreSQL    │
│   (Port 3000)   │         │   (Port 5000)   │         │   (Port 5432)   │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                     │
                                     │
                                     ▼
                            ┌─────────────────┐
                            │                 │
                            │  Partner APIs   │
                            │  (Slice, etc.)  │
                            │                 │
                            └─────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 - UI framework
- React Router - Navigation
- Axios - HTTP client
- React Toastify - Notifications

**Backend:**
- Node.js 18 - Runtime
- Express - Web framework
- PostgreSQL - Database
- JWT - Authentication
- bcrypt - Password hashing
- Multer - File uploads

**DevOps:**
- Docker - Containerization
- Docker Compose - Orchestration
- Nginx - Frontend serving

## 📁 Project Structure

```
converge/
├── docker-compose.yml          # Orchestration configuration
├── .env.example                # Environment variables template
├── README.md                   # This file
│
├── db/
│   └── init.sql                # Database schema & seed data
│
├── server/                     # Backend API
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js            # Entry point
│       ├── config/
│       │   ├── database.js     # PostgreSQL connection
│       │   └── index.js        # App configuration
│       ├── middleware/
│       │   ├── auth.js         # JWT & RBAC middleware
│       │   ├── upload.js       # File upload handler
│       │   ├── validator.js    # Request validation
│       │   └── errorHandler.js # Global error handler
│       ├── controllers/
│       │   ├── authController.js        # Authentication
│       │   ├── kycController.js         # KYC workflow
│       │   ├── transactionController.js # Transactions
│       │   └── partnerController.js     # Partner APIs
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── kycRoutes.js
│       │   ├── transactionRoutes.js
│       │   └── partnerRoutes.js
│       └── services/
│           └── cibilService.js  # Credit score engine
│
└── client/                     # Frontend React App
    ├── Dockerfile
    ├── nginx.conf              # Nginx configuration
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js            # Entry point
        ├── App.js              # Main app component
        ├── api.js              # API client
        ├── AuthContext.js      # Auth state management
        ├── components/
        │   ├── Navbar.js
        │   └── ProtectedRoute.js
        └── pages/
            ├── Home.js
            ├── Login.js
            ├── Register.js
            ├── Dashboard.js
            ├── Documents.js
            ├── Transactions.js
            └── AdminPanel.js
```

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop))
- Git installed
- 8GB RAM recommended
- Ports 3000, 5000, 5432 available

### Setup Instructions

1. **Clone the repository**
```bash
git clone <repository-url>
cd v3
```

2. **Create environment file**
```bash
cp .env.example .env
```

3. **Start all services with Docker Compose**
```bash
docker-compose up --build
```

This single command will:
- Build the React frontend
- Build the Node.js backend
- Start PostgreSQL database
- Create database schema
- Seed initial data
- Start all services

4. **Access the application**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

### Default Credentials

**Admin Account:**
- Email: `admin@converge.com`
- Password: `Admin@123456`

**Test User:**
- Register a new account at http://localhost:3000/register

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123",
  "fullName": "John Doe",
  "phone": "+919876543210",
  "dateOfBirth": "1990-01-01",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postalCode": "400001"
}
```

#### POST `/api/auth/login`
Login user
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123"
}
```

#### GET `/api/auth/profile`
Get current user profile (requires auth)

### KYC Endpoints

#### POST `/api/kyc/documents/upload`
Upload KYC document (multipart/form-data)
- **Header:** `Authorization: Bearer <token>`
- **Body:**
  - `document`: File (PDF, JPG, PNG, max 5MB)
  - `documentType`: enum (aadhaar, pan, passport, etc.)
  - `documentNumber`: string (optional)

#### GET `/api/kyc/documents`
Get user's uploaded documents

#### POST `/api/kyc/submit`
Submit KYC for admin review

#### GET `/api/kyc/status`
Get KYC verification status

#### GET `/api/kyc/admin/pending` (Admin only)
Get all pending KYC requests

#### POST `/api/kyc/admin/review/:userId` (Admin only)
Approve or reject KYC
```json
{
  "action": "approve",  // or "reject"
  "rejectionReason": "Incomplete documents"  // required if rejecting
}
```

### Transaction Endpoints

#### POST `/api/transactions`
Add a transaction
```json
{
  "transactionType": "credit",  // or "debit"
  "amount": 5000.00,
  "description": "Salary credit",
  "merchantName": "Company XYZ",
  "category": "income",
  "transactionDate": "2026-01-08"
}
```

#### GET `/api/transactions`
Get user transactions (supports pagination)

#### GET `/api/transactions/credit-score`
Get calculated credit score and details

### Partner Integration Endpoints

#### POST `/api/partner/link`
Initiate account linking (Partner initiates)
```json
{
  "partnerCode": "SLICE",
  "userId": "user-uuid"
}
```

#### GET `/api/partner/verify-kyc`
Verify user KYC status
- **Headers:**
  - `Authorization: Bearer <access_token>`
  - `apiKey: <partner_api_key>`

#### GET `/api/partner/user-data`
Get user credit score and transaction history
- **Headers:**
  - `Authorization: Bearer <access_token>`
  - `apiKey: <partner_api_key>`

## 💳 Credit Score Calculation

The CIBIL score engine uses a weighted algorithm:

### Components (Total = 100%)
- **Total Transactions** (20%): More transactions = higher score
- **Average Amount** (15%): Higher transaction amounts indicate financial activity
- **Credit/Debit Ratio** (30%): More credits than debits is favorable
- **Transaction Frequency** (15%): Regular activity is positive
- **Recent Activity** (20%): Active in last 30 days

### Score Range
- **300-550**: Poor
- **550-650**: Fair
- **650-750**: Good
- **750-900**: Excellent

### Calculation Formula
```javascript
rawScore = (
  totalTransactionsScore * 0.20 +
  avgAmountScore * 0.15 +
  creditDebitRatioScore * 0.30 +
  frequencyScore * 0.15 +
  recentActivityScore * 0.20
)

finalScore = 300 + (rawScore * 600)  // Normalize to 300-900
```

## 🔒 Security Features

### Authentication & Authorization
- ✅ JWT-based authentication with expiry
- ✅ Role-Based Access Control (User, Admin, Partner)
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Password strength requirements enforced

### Data Protection
- ✅ No hard-coded secrets (environment variables)
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (Helmet.js)
- ✅ CORS configured
- ✅ File upload validation (type, size)

### API Security
- ✅ Request validation middleware
- ✅ Rate limiting ready (can be added)
- ✅ Partner API key authentication
- ✅ Token-based partner access with expiry

## 🧪 Testing the System

### User Flow

1. **Register**: Create account at `/register`
2. **Login**: Sign in with credentials
3. **Upload Documents**: Go to `/documents` and upload ID proofs
4. **Submit KYC**: Click "Submit for Review" button
5. **Add Transactions**: Go to `/transactions` and add financial history
6. **View Score**: Check credit score on `/dashboard`

### Admin Flow

1. **Login**: Use admin credentials
2. **Review Queue**: See pending requests at `/admin`
3. **View Documents**: Click "View Documents" for any request
4. **Take Action**: Approve or reject with reason

### Partner Integration Test

Use API testing tool (Postman/curl):

```bash
# 1. Get partner API key from database
docker exec -it converge-db psql -U converge_user -d converge_db -c "SELECT api_key FROM partner_integrations WHERE partner_code='SLICE';"

# 2. Link user account
curl -X POST http://localhost:5000/api/partner/link \
  -H "Content-Type: application/json" \
  -d '{"partnerCode": "SLICE", "userId": "<user-id>"}'

# 3. Verify KYC
curl -X GET http://localhost:5000/api/partner/verify-kyc \
  -H "Authorization: Bearer <access-token>" \
  -H "apiKey: <partner-api-key>"
```

## 🗄️ Database Schema

### Key Tables

**users**: User accounts with roles
**kyc_profiles**: KYC status and personal info
**documents**: Uploaded identity documents
**transactions**: Financial transaction history
**partner_integrations**: Registered partner platforms
**user_partner_links**: OAuth-like access tokens
**kyc_review_history**: Audit trail of KYC reviews

### Relationships

```sql
users (1) ──── (1) kyc_profiles
users (1) ──── (N) documents
users (1) ──── (N) transactions
users (1) ──── (N) user_partner_links
partner_integrations (1) ──── (N) user_partner_links
```

## 🔧 Configuration

### Environment Variables

```bash
# Database
POSTGRES_USER=converge_user
POSTGRES_PASSWORD=converge_secure_pass_2026
POSTGRES_DB=converge_db

# Backend
JWT_SECRET=your_jwt_secret_minimum_32_characters
ADMIN_EMAIL=admin@converge.com
ADMIN_PASSWORD=Admin@123456

# Frontend
REACT_APP_API_URL=http://localhost:5000/api
```

### File Upload Limits

- **Max file size**: 5MB
- **Allowed types**: PDF, JPG, JPEG, PNG
- **Storage**: Local filesystem (use cloud storage in production)

## 📋 Assumptions & Limitations

### Assumptions

1. **Mock Document Storage**: Files stored locally; production should use AWS S3/Azure Blob
2. **Simplified Credit Scoring**: Real CIBIL uses complex algorithms with credit bureau data
3. **Single Currency**: All transactions in INR (₹)
4. **Admin Approval**: Manual KYC review (can be automated with AI/ML)
5. **Partner Trust**: Slice and other partners are pre-registered and trusted
6. **Development Setup**: Using default passwords (change in production!)

### Limitations

1. **No Email Verification**: Users can register without email confirmation
2. **No SMS OTP**: Phone verification not implemented
3. **No Document OCR**: Admin manually reviews documents
4. **No Real OAuth**: Simplified OAuth-like flow for demo
5. **No Rate Limiting**: API calls not rate-limited
6. **Local Storage**: Files and data not in cloud storage
7. **No Encryption at Rest**: Database and files not encrypted
8. **No Audit Logs**: Limited logging of actions
9. **No Backup Strategy**: No automated database backups
10. **Single Region**: No multi-region deployment

## 🚀 Production Deployment Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Generate strong JWT secret (min 32 chars)
- [ ] Use managed database (AWS RDS, Azure Database)
- [ ] Implement cloud storage (S3, Azure Blob)
- [ ] Add SSL/TLS certificates
- [ ] Enable rate limiting
- [ ] Add monitoring (Prometheus, Grafana)
- [ ] Implement logging (ELK stack)
- [ ] Set up automated backups
- [ ] Add CI/CD pipeline
- [ ] Enable encryption at rest
- [ ] Implement email/SMS services
- [ ] Add comprehensive error tracking (Sentry)
- [ ] Security audit and penetration testing
- [ ] Load testing
- [ ] Document API with OpenAPI/Swagger

## 🛠️ Development

### Running without Docker

**Backend:**
```bash
cd server
npm install
# Create .env file
npm run dev
```

**Frontend:**
```bash
cd client
npm install
# Create .env file
npm start
```

**Database:**
```bash
# Start PostgreSQL locally
# Run init.sql manually
```

### Stopping Services

```bash
docker-compose down        # Stop all services
docker-compose down -v     # Stop and remove volumes (clean state)
```

## 📞 Support

For issues and questions:
- Check existing issues in repository
- Create new issue with detailed description
- Include logs and error messages

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Built for FinTech domain KYC centralization
- Inspired by modern identity verification platforms
- Follows industry best practices for security and scalability

---

**Made with ❤️ for Anokha v3**

*Note: This is a demonstration project. Additional hardening required for production use.*
