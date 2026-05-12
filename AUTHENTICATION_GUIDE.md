# Authentication & Authorization Guide

## Overview
This REST API implements JWT-based authentication with role-based authorization. All endpoints are protected according to their sensitivity and the data they access.

## Authentication Flow

### 1. Register a New User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "Password123",
  "role": "user" // optional: user, moderator, admin
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

### 2. Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "Password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

### 3. Use the Token
Include the JWT token in the Authorization header for all protected requests:
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## User Roles

### Role Hierarchy
1. **Admin** (level 3) - Full access to all resources
2. **Moderator** (level 2) - Can manage most content
3. **User** (level 1) - Can manage own resources and basic operations

### Role Permissions

| Resource | Read | Create | Update | Delete | Notes |
|----------|------|--------|--------|--------|-------|
| Lots | Public | Authenticated | Owner/Admin | Owner/Admin | Public can view, authenticated can create |
| Users | Public (filtered) | Admin | Owner/Admin | Admin | Public sees limited data |
| Bids | Authenticated | Authenticated | Bidder/Admin | Bidder/Admin | Requires authentication |

## Protected Endpoints

### Authentication Required
These endpoints require a valid JWT token:

#### User Management
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update own profile
- `POST /api/auth/change-password` - Change own password
- `POST /api/auth/refresh` - Refresh JWT token

#### Lot Management
- `POST /api/lots` - Create new lot
- `PUT /api/lots/:id` - Update own lot
- `DELETE /api/lots/:id` - Delete own lot
- `POST /api/lots/:id/bid` - Place bid

#### Bid Management
- `GET /api/bids` - Get all bids
- `GET /api/bids/:lotId/:bidderId` - Get specific bid
- `POST /api/bids` - Create bid
- `PUT /api/bids/:lotId/:bidderId` - Update own bid
- `DELETE /api/bids/:lotId/:bidderId` - Delete own bid

#### User Data Access
- `GET /api/users/:id/lots` - Get own lots
- `GET /api/users/:id/bids` - Get own bids
- `GET /api/users/:id/statistics` - Get own statistics

### Admin Only
These endpoints require admin role:

- `POST /api/users` - Create user
- `DELETE /api/users/:id` - Delete user
- `GET /api/auth/users` - Get all users

### Public Endpoints
These endpoints don't require authentication:

- `GET /api/lots` - Get all lots
- `GET /api/lots/:id` - Get specific lot
- `GET /api/lots/:id/statistics` - Get lot statistics
- `GET /api/bids/lot/:lotId` - Get lot bids
- `GET /api/bids/highest/:lotId` - Get highest bid
- `GET /api/bids/statistics/:lotId` - Get bid statistics
- `GET /api/users` - Get users (filtered)
- `GET /api/users/:id` - Get user (filtered)
- `GET /api/users/ranking` - Get user ranking

## Error Handling

### Authentication Errors (401)
```json
{
  "success": false,
  "message": "Access denied",
  "error": "No token provided or invalid format"
}
```

### Authorization Errors (403)
```json
{
  "success": false,
  "message": "Access denied",
  "error": "Requires admin role or higher"
}
```

### Ownership Errors (403)
```json
{
  "success": false,
  "message": "Access denied",
  "error": "You can only access your own resources"
}
```

## Security Features

### Password Security
- Passwords are hashed using bcrypt with 12 salt rounds
- Minimum password length: 6 characters
- Password complexity: At least one uppercase, one lowercase, and one number

### JWT Token Security
- Tokens expire after 24 hours (configurable)
- Tokens contain user ID, email, name, and role
- Invalid tokens are immediately rejected

### Input Validation
- All inputs are validated using express-validator
- SQL injection protection through parameterized queries
- XSS protection through input sanitization

## Usage Examples

### Complete Authentication Flow

#### 1. Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "password": "SecurePass123"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123"
  }'
```

#### 3. Create a Lot (Authenticated)
```bash
curl -X POST http://localhost:3000/api/lots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Vintage Camera",
    "description": "A beautiful vintage camera from 1960s",
    "startPrice": 500,
    "ownerName": "Alice Johnson"
  }'
```

#### 4. Place a Bid (Authenticated)
```bash
curl -X POST http://localhost:3000/api/lots/lot_123/bid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bidderName": "Alice Johnson",
    "amount": 600
  }'
```

#### 5. Get Profile (Authenticated)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Environment Variables

Add these to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
```

## Best Practices

### For Developers
1. **Always use HTTPS** in production to protect JWT tokens
2. **Store tokens securely** on the client side (httpOnly cookies or secure storage)
3. **Implement token refresh** before expiration for better UX
4. **Validate all inputs** on both client and server side
5. **Use role-based access** consistently across all endpoints

### For Users
1. **Use strong passwords** with the required complexity
2. **Keep tokens secure** and don't share them
3. **Log out** when finished (client-side token deletion)
4. **Change passwords** regularly
5. **Report suspicious activity** immediately

## Token Refresh

When your token is about to expire, you can refresh it:

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer YOUR_CURRENT_TOKEN"
```

This will return a new token with the same user information.

## Troubleshooting

### Common Issues

#### "Invalid token" Error
- Check if token is properly formatted: `Authorization: Bearer <token>`
- Verify token hasn't expired
- Ensure JWT_SECRET is consistent across server restarts

#### "Access denied" Error
- Verify user has required role for the endpoint
- Check if you're trying to access another user's resources
- Ensure you're using the correct HTTP method

#### "Password validation failed" Error
- Password must be at least 6 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter  
- Must contain at least one number

### Debug Mode
For development, you can check the current user by accessing the profile endpoint:

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN" | jq .
```

This will show you the current user's ID, role, and permissions.
