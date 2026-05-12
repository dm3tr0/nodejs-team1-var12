# Auction REST API Documentation

## Overview
This REST API provides full CRUD operations for an auction system with Users, Lots, and Bids. All operations return appropriate HTTP status codes and JSON responses.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently no authentication is required (for development purposes).

## Response Format
All responses follow this structure:
```json
{
  "success": true|false,
  "message": "Description of the operation",
  "data": { ... }, // Success responses only
  "error": "Error message", // Error responses only
  "errors": [ ... ] // Validation errors only
}
```

## HTTP Status Codes
- `200` - Success (GET, PUT, DELETE)
- `201` - Created (POST)
- `400` - Bad Request (validation errors, business rule violations)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

# Lots Resource

## CRUD Operations

### Get All Lots
```
GET /api/lots
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (1-100, default: 10)
- `status` (string, optional): Filter by status (active, completed, cancelled)
- `ownerId` (string, optional): Filter by owner ID
- `search` (string, optional): Search in title, description, keywords
- `minPrice` (number, optional): Minimum start price
- `maxPrice` (number, optional): Maximum start price
- `sortBy` (string, optional): Sort field (title, start_price, current_price, created_at, owner_name)
- `sortOrder` (string, optional): Sort order (asc, desc)

**Example:**
```bash
GET /api/lots?page=1&limit=5&status=active&sortBy=current_price&sortOrder=desc
```

### Get Single Lot
```
GET /api/lots/:id
```

### Create Lot
```
POST /api/lots
```

**Request Body:**
```json
{
  "title": "Vintage Watch",
  "description": "A beautiful vintage watch from 1950",
  "startPrice": 1000,
  "ownerId": "user_123",
  "ownerName": "John Doe",
  "status": "active",
  "keywords": ["vintage", "watch", "collectible"],
  "imageUrl": "https://example.com/watch.jpg"
}
```

### Update Lot
```
PUT /api/lots/:id
```

**Request Body:**
```json
{
  "title": "Updated Vintage Watch",
  "description": "A beautiful vintage watch from 1950 - excellent condition",
  "currentPrice": 1200,
  "status": "active"
}
```

### Delete Lot
```
DELETE /api/lots/:id
```

## Business Operations

### Place Bid
```
POST /api/lots/:id/bid
```

**Request Body:**
```json
{
  "bidderId": "user_456",
  "bidderName": "Jane Smith",
  "amount": 1500
}
```

### Get Lot Statistics
```
GET /api/lots/:id/statistics
```

---

# Users Resource

## CRUD Operations

### Get All Users
```
GET /api/users
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (1-100, default: 10)
- `search` (string, optional): Search by name
- `hasLots` (boolean, optional): Filter users with lots
- `hasBids` (boolean, optional): Filter users with bids
- `sortBy` (string, optional): Sort field (name, email, created_at)
- `sortOrder` (string, optional): Sort order (asc, desc)

### Get Single User
```
GET /api/users/:id
```

### Create User
```
POST /api/users
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com"
}
```

### Update User
```
PUT /api/users/:id
```

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com"
}
```

### Delete User
```
DELETE /api/users/:id
```

## Relationship Operations

### Get User's Lots
```
GET /api/users/:id/lots
```

### Get User's Bid History
```
GET /api/users/:id/bids
```

### Get User Statistics
```
GET /api/users/:id/statistics
```

### Get User Ranking
```
GET /api/users/ranking?limit=10
```

---

# Bids Resource

## CRUD Operations

### Get All Bids
```
GET /api/bids
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (1-100, default: 10)
- `lotId` (string, optional): Filter by lot ID
- `bidderId` (string, optional): Filter by bidder ID
- `minAmount` (number, optional): Minimum bid amount
- `maxAmount` (number, optional): Maximum bid amount
- `sortBy` (string, optional): Sort field (amount, created_at)
- `sortOrder` (string, optional): Sort order (asc, desc)

### Get Specific Bid
```
GET /api/bids/:lotId/:bidderId
```

### Create Bid
```
POST /api/bids
```

**Request Body:**
```json
{
  "lotId": "lot_123",
  "bidderId": "user_456",
  "bidderName": "Jane Smith",
  "amount": 1500
}
```

### Update Bid
```
PUT /api/bids/:lotId/:bidderId
```

**Request Body:**
```json
{
  "amount": 1600
}
```

### Delete Bid
```
DELETE /api/bids/:lotId/:bidderId
```

## Specialized Operations

### Get Bids for Lot
```
GET /api/bids/lot/:lotId?limit=50
```

### Get Bids for Bidder
```
GET /api/bids/bidder/:bidderId
```

### Get Highest Bid for Lot
```
GET /api/bids/highest/:lotId
```

### Get Bid Statistics for Lot
```
GET /api/bids/statistics/:lotId
```

### Get Competitive Analysis
```
GET /api/bids/analysis/:lotId
```

---

# Examples

## Create a Complete Auction Flow

### 1. Create Users
```bash
POST /api/users
{
  "name": "Alice Johnson",
  "email": "alice@example.com"
}

POST /api/users
{
  "name": "Bob Smith",
  "email": "bob@example.com"
}
```

### 2. Create a Lot
```bash
POST /api/lots
{
  "title": "Rare Book Collection",
  "description": "First edition collection of rare books",
  "startPrice": 500,
  "ownerId": "user_alice_id",
  "ownerName": "Alice Johnson"
}
```

### 3. Place Bids
```bash
POST /api/lots/lot_id/bid
{
  "bidderId": "user_bob_id",
  "bidderName": "Bob Smith",
  "amount": 600
}

POST /api/lots/lot_id/bid
{
  "bidderId": "user_bob_id",
  "bidderName": "Bob Smith",
  "amount": 750
}
```

### 4. Get Statistics
```bash
GET /api/lots/lot_id/statistics
GET /api/bids/statistics/lot_id
GET /api/users/user_bob_id/statistics
```

## Filtering and Pagination Examples

### Filter Active Lots Under $1000
```bash
GET /api/lots?status=active&maxPrice=1000&page=1&limit=20
```

### Search Lots by Keywords
```bash
GET /api/lots?search=vintage&sortBy=current_price&sortOrder=desc
```

### Get Users with Lots and Bids
```bash
GET /api/users?hasLots=true&hasBids=true&sortBy=name&sortOrder=asc
```

### Get Bids in Price Range
```bash
GET /api/bids?minAmount=100&maxAmount=1000&sortBy=amount&sortOrder=desc
```

---

# Error Handling

## Validation Errors (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title must be between 3 and 100 characters"
    }
  ]
}
```

## Not Found Errors (404)
```json
{
  "success": false,
  "message": "Lot not found",
  "error": "Lot with ID lot_123 does not exist"
}
```

## Business Rule Violations (400)
```json
{
  "success": false,
  "message": "Bid placement failed",
  "error": "Owner cannot bid on their own lot"
}
```

## Server Errors (500)
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

---

# Testing

Use tools like:
- Postman
- curl
- HTTPie

Example curl command:
```bash
curl -X POST http://localhost:3000/api/lots \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Item",
    "description": "A test item for the auction",
    "startPrice": 100,
    "ownerId": "user_test",
    "ownerName": "Test User"
  }'
```
