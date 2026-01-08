# Converge API Testing Guide

## Using cURL

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass@123",
    "fullName": "John Doe",
    "phone": "+919876543210",
    "dateOfBirth": "1990-05-15",
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001"
  }'
```

Save the token from response as `USER_TOKEN`

### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@converge.com",
    "password": "Admin@123456"
  }'
```

### 4. Get Profile
```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Upload Document
```bash
curl -X POST http://localhost:5000/api/kyc/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "document=@/path/to/your/document.pdf" \
  -F "documentType=aadhaar" \
  -F "documentNumber=1234-5678-9012"
```

### 6. Get Documents
```bash
curl http://localhost:5000/api/kyc/documents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 7. Submit KYC
```bash
curl -X POST http://localhost:5000/api/kyc/submit \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 8. Add Transaction
```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionType": "credit",
    "amount": 50000,
    "description": "Monthly Salary",
    "merchantName": "ABC Company",
    "category": "income",
    "transactionDate": "2026-01-08"
  }'
```

### 9. Get Transactions
```bash
curl http://localhost:5000/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 10. Get Credit Score
```bash
curl http://localhost:5000/api/transactions/credit-score \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 11. Admin - Get Pending KYC
```bash
curl http://localhost:5000/api/kyc/admin/pending \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

### 12. Admin - Review KYC (Approve)
```bash
curl -X POST http://localhost:5000/api/kyc/admin/review/USER_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve"
  }'
```

### 13. Admin - Review KYC (Reject)
```bash
curl -X POST http://localhost:5000/api/kyc/admin/review/USER_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reject",
    "rejectionReason": "Document quality is poor, please resubmit clear copies"
  }'
```

### 14. Partner - Link Account
```bash
curl -X POST http://localhost:5000/api/partner/link \
  -H "Content-Type: application/json" \
  -d '{
    "partnerCode": "SLICE",
    "userId": "USER_ID_HERE"
  }'
```

Save the `accessToken` from response

### 15. Partner - Verify KYC
```bash
# First get API key from database:
# docker exec -it converge-db psql -U converge_user -d converge_db -c "SELECT api_key FROM partner_integrations WHERE partner_code='SLICE';"

curl http://localhost:5000/api/partner/verify-kyc \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" \
  -H "apiKey: PARTNER_API_KEY_HERE"
```

### 16. Partner - Get User Data
```bash
curl http://localhost:5000/api/partner/user-data \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" \
  -H "apiKey: PARTNER_API_KEY_HERE"
```

## Complete Test Flow

### Scenario 1: New User Registration to KYC Approval

```bash
# Step 1: Register
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass@123",
    "fullName": "Test User",
    "phone": "+919876543210"
  }')

USER_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.token')
USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.data.user.id')

echo "User Token: $USER_TOKEN"
echo "User ID: $USER_ID"

# Step 2: Upload document (replace with actual file path)
curl -X POST http://localhost:5000/api/kyc/documents/upload \
  -H "Authorization: Bearer $USER_TOKEN" \
  -F "document=@sample-doc.pdf" \
  -F "documentType=pan"

# Step 3: Submit KYC
curl -X POST http://localhost:5000/api/kyc/submit \
  -H "Authorization: Bearer $USER_TOKEN"

# Step 4: Admin login
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@converge.com",
    "password": "Admin@123456"
  }')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.data.token')

# Step 5: Admin approves
curl -X POST http://localhost:5000/api/kyc/admin/review/$USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve"
  }'

# Step 6: Add transactions
curl -X POST http://localhost:5000/api/transactions \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionType": "credit",
    "amount": 50000,
    "description": "Salary"
  }'

# Step 7: Check credit score
curl http://localhost:5000/api/transactions/credit-score \
  -H "Authorization: Bearer $USER_TOKEN"
```

### Scenario 2: Partner Integration

```bash
# Get partner API key
API_KEY=$(docker exec -it converge-db psql -U converge_user -d converge_db -t -c "SELECT api_key FROM partner_integrations WHERE partner_code='SLICE';" | tr -d ' ')

# Link user account (use USER_ID from above)
LINK_RESPONSE=$(curl -s -X POST http://localhost:5000/api/partner/link \
  -H "Content-Type: application/json" \
  -d "{
    \"partnerCode\": \"SLICE\",
    \"userId\": \"$USER_ID\"
  }")

ACCESS_TOKEN=$(echo $LINK_RESPONSE | jq -r '.data.accessToken')

# Verify KYC
curl http://localhost:5000/api/partner/verify-kyc \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "apiKey: $API_KEY"

# Get user data
curl http://localhost:5000/api/partner/user-data \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "apiKey: $API_KEY"
```

## Postman Collection

Import these into Postman as environment variables:
- `base_url`: http://localhost:5000/api
- `user_token`: (set after login)
- `admin_token`: (set after admin login)
- `user_id`: (set after registration)
- `access_token`: (set after partner link)
- `api_key`: (set from database)

## Expected Responses

### Success Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]  // Optional validation errors
}
```

## Common HTTP Status Codes

- `200 OK`: Successful GET/PUT request
- `201 Created`: Successful POST creating new resource
- `400 Bad Request`: Validation error or bad input
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists (e.g., email)
- `500 Internal Server Error`: Server error

## Testing Tips

1. Always save tokens after login/registration
2. Use environment variables for tokens in Postman
3. Check token expiry (7 days by default)
4. Admin token needed for admin endpoints
5. Partner APIs use both access token and API key
6. File uploads require multipart/form-data
7. KYC must be approved before partner can access data
