# Quick Start Guide - Converge KYC System

## 🚀 Get Started in 3 Minutes

### 1. Prerequisites Check
```bash
# Check Docker is installed
docker --version
docker-compose --version

# Should show Docker version 20+ and Docker Compose version 2+
```

### 2. Start the Application
```bash
# Navigate to project directory
cd v3

# Start all services (first time will take 2-3 minutes)
docker-compose up --build

# Wait for these messages:
# ✓ Database connected successfully
# ✓ Converge KYC API Server Running
```

### 3. Access the Application
Open in your browser:
- **Application**: http://localhost:3000
- **API Health**: http://localhost:5000/api/health
- **Database UI (pgAdmin)**: http://localhost:5050
  - Login: `admin@converge.com` / `Admin@123456`
  - See `pgadmin/README.md` for database connection setup

### 4. Test the System

#### Option A: User Flow (5 minutes)
1. Click "Register" and create a new account
2. Fill in all details (use strong password with uppercase, lowercase, number, special char)
3. After login, go to "Documents" tab
4. Upload at least one document (any PDF/image under 5MB)
5. Click "Submit for Review"
6. Go to "Transactions" tab
7. Add some sample transactions (mix of credits and debits)
8. View your credit score on "Dashboard"

#### Option B: Admin Flow (2 minutes)
1. Click "Login"
2. Use admin credentials:
   - Email: `admin@converge.com`
   - Password: `Admin@123456`
3. You'll see the Admin Panel with pending KYC requests
4. Click "View Documents" on any user
5. Review and either "Approve" or "Reject" (with reason)

### 5. Test Partner Integration (Slice)

Get the partner API key:
```bash
docker exec -it converge-db psql -U converge_user -d converge_db -c "SELECT api_key FROM partner_integrations WHERE partner_code='SLICE';"
```

Test the API (replace placeholders):
```bash
# 1. Link user account (replace USER_ID with actual UUID from registration)
curl -X POST http://localhost:5000/api/partner/link \
  -H "Content-Type: application/json" \
  -d '{"partnerCode": "SLICE", "userId": "USER_ID_HERE"}'

# Response will include accessToken - copy it

# 2. Verify KYC status
curl -X GET http://localhost:5000/api/partner/verify-kyc \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" \
  -H "apiKey: API_KEY_FROM_DATABASE"
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using the ports
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :5432

# Kill the process or change ports in docker-compose.yml
```

### Database Connection Error
```bash
# Wait 30 seconds for database to initialize
# Or restart services:
docker-compose down
docker-compose up
```

### Frontend Not Loading
```bash
# Check backend is running:
curl http://localhost:5000/api/health

# Should return: {"success":true,"message":"Converge API is running"}
```

### Clear Everything and Start Fresh
```bash
docker-compose down -v  # Remove all containers and volumes
docker-compose up --build  # Rebuild and restart
```

## 📊 Sample Data

### Create Sample Transactions Quickly
Login as a user and use this bulk transaction JSON:
```json
{
  "transactions": [
    {"transactionType": "credit", "amount": 50000, "description": "Salary", "transactionDate": "2026-01-01"},
    {"transactionType": "debit", "amount": 15000, "description": "Rent", "transactionDate": "2026-01-02"},
    {"transactionType": "debit", "amount": 3000, "description": "Groceries", "transactionDate": "2026-01-05"},
    {"transactionType": "credit", "amount": 5000, "description": "Freelance work", "transactionDate": "2026-01-06"},
    {"transactionType": "debit", "amount": 2000, "description": "Utilities", "transactionDate": "2026-01-07"}
  ]
}
```

Use Postman or curl:
```bash
curl -X POST http://localhost:5000/api/transactions/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @sample-transactions.json
```

## 📝 Key Features to Test

- [x] User registration with validation
- [x] JWT authentication
- [x] Role-based access (User vs Admin)
- [x] Document upload (multi-file support)
- [x] KYC submission workflow
- [x] Admin review and approval/rejection
- [x] Transaction history tracking
- [x] Credit score calculation (auto-updates)
- [x] Partner API integration
- [x] Responsive UI design

## 🎯 What's Next?

After testing locally:
1. Review the code structure
2. Check the database schema in `db/init.sql`
3. Explore API endpoints in README.md
4. Customize the credit score weights in `server/src/config/index.js`
5. Add more document types if needed

## 💡 Tips

- Credit score updates automatically when you add transactions
- Use meaningful descriptions for transactions to see better insights
- Admin must provide rejection reason when rejecting KYC
- Partner access token expires after 90 days
- All passwords are hashed with bcrypt

## 🛑 Stopping the Application

```bash
# Stop all services (keeps data)
docker-compose down

# Stop and remove all data (fresh start next time)
docker-compose down -v
```

## 📞 Need Help?

Check the full README.md for:
- Complete API documentation
- Architecture details
- Database schema
- Security features
- Production deployment checklist

Happy Testing! 🚀
