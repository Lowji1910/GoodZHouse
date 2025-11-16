# GoodzHouse E-commerce Platform

## Overview
GoodzHouse is a full-stack e-commerce application built with React (frontend) and Node.js/Express (backend) with MongoDB database. The application supports product management, order processing, user authentication, real-time notifications, and admin panel features.

## Recent Changes (November 16, 2025)
1. **Notification Management Feature**
   - Added NotificationBell component to admin navbar in AdminLayout.js
   - Component shows unread notification count and provides dropdown access to recent notifications
   - Integrated with existing notification API endpoints

2. **Excel Import/Export for Products**
   - Updated Products.js to use backend API endpoints for Excel operations
   - Endpoints: /api/admin/products/export, /import, /import-template
   - Removed client-side XLSX processing in favor of server-side handling

3. **Proxy Configuration**
   - Created setupProxy.js to route /api requests from frontend (port 5000) to backend (port 3001)
   - Updated src/services/api.js to use relative paths for development (proxy-friendly)
   - Fixed BASE_URL logic to support both development (proxy) and production (absolute URLs)

4. **Frontend Configuration**
   - Configured React dev server to run on port 5000 with HOST=0.0.0.0
   - Added DANGEROUSLY_DISABLE_HOST_CHECK=true for Replit proxy compatibility
   - Fixed source-map dependency issue by downgrading to stable version 0.7.4

5. **Deployment Configuration**
   - Set up autoscale deployment target
   - Configured concurrent running of frontend and backend servers

## Project Architecture

### Frontend (Port 5000)
- **Technology**: React with Create React App
- **Key Features**:
  - Product catalog and shopping cart
  - User authentication (login/register)
  - Admin panel for product, category, order management
  - Real-time notifications via Socket.IO
  - Excel import/export for products
  
### Backend (Port 3001)
- **Technology**: Node.js with Express
- **Database**: MongoDB (via Mongoose)
- **Key Features**:
  - RESTful API for all resources
  - JWT-based authentication
  - Excel file processing (ExcelJS)
  - Real-time features (Socket.IO)
  - Admin routes for CRUD operations

### Key Files
- `src/pages/Admin/AdminLayout.js` - Admin navigation with notification bell
- `src/pages/Admin/Products.js` - Product management with Excel import/export
- `src/setupProxy.js` - Development proxy configuration
- `src/services/api.js` - Centralized API client
- `backend/src/routes/admin.js` - Admin API routes including Excel endpoints
- `backend/src/controllers/excelController.js` - Excel import/export logic
- `backend/.env` - Backend environment configuration

## Environment Variables

### Frontend (.env)
```
REACT_APP_API_BASE_URL=  # Leave empty for dev (uses proxy), set for production
```

### Backend (backend/.env)
```
PORT=3001
JWT_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
```

### Replit Secrets (Required)
- `MONGODB_URI` - MongoDB connection string (currently set to localhost, needs Atlas URI)
- `JWT_SECRET` - JWT access token secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret

## Important Notes

### MongoDB Configuration
⚠️ **ACTION REQUIRED**: The MONGODB_URI secret currently points to `mongodb://localhost:27017/goodzhouse`. For the application to work properly in Replit, this needs to be updated to a MongoDB Atlas connection string.

To fix:
1. Go to Secrets pane in Replit
2. Update MONGODB_URI with your MongoDB Atlas connection string
3. Format: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`
4. Restart the workflow after updating

### Proxy vs Production
- **Development**: API calls use relative paths (`/api/...`) which are proxied to port 3001
- **Production**: Set `REACT_APP_API_BASE_URL` to your backend URL

### Known Issues
- Frontend may fail if MONGODB_URI is not configured with valid Atlas connection
- Source-map dependency was fixed by downgrading to version 0.7.4

## User Preferences
None documented yet.

## Running the Application
```bash
npm run dev
```
This command runs both frontend (port 5000) and backend (port 3001) concurrently.
