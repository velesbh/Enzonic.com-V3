# Admin System Documentation

## Overview

The admin system provides comprehensive management capabilities for the Enzonic platform, including:

- **Clerk-based Authentication**: Secure role-based access control
- **Environment Variable Management**: Live configuration updates
- **Service Configuration**: Customize logos, icons, names, and settings for each service
- **Live Statistics**: Real-time monitoring and analytics
- **System Health**: Performance metrics and system status

## Setup Instructions

### 1. Configure Admin User

To grant admin access to a user, you need to set the role in Clerk:

1. Go to your Clerk dashboard
2. Navigate to Users
3. Select the user you want to make an admin
4. In the user's metadata, add:
   ```json
   {
     "role": "admin"
   }
   ```
   
You can add this to:
- `publicMetadata` (visible to client)
- `privateMetadata` (server-only)
- `unsafeMetadata` (legacy, not recommended)

### 2. Environment Variables

The admin panel allows you to manage these environment variables:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=enzonic_db

# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_OPENAI_API_URL=https://ai-api.enzonic.me/api/v1/chat/completions

# API Configuration
VITE_API_URL=http://localhost:3001
PORT=3001

# Application Settings
VITE_APP_NAME=ENZONIC
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Modular AI-powered platform
```

### 3. Database Setup

The admin system automatically creates required tables:

- `translation_history`: Stores user translation history
- `admin_data`: Stores admin configurations and service settings

### 4. Start the System

```bash
# Install backend dependencies
npm run backend:install

# Start both frontend and backend
npm run dev
```

## Features

### 🔐 Authentication & Authorization

- **Clerk Integration**: Secure OAuth-based authentication
- **Role-Based Access**: Only users with `admin` role can access
- **Token Verification**: All admin API calls are authenticated

### ⚙️ Environment Management

- **Live Configuration**: Update environment variables without restarting
- **Security**: Sensitive variables (passwords, keys) are masked
- **Validation**: Prevents invalid configurations

### 🎨 Service Configuration

Each service can be customized with:

- **Name**: Display name for the service
- **Logo**: Custom logo image path
- **Icon**: Lucide icon identifier
- **Description**: Service description text
- **Color**: Brand color (hex code)
- **Endpoint**: Service route/URL
- **Status**: Enable/disable service

### 📊 Live Statistics

Real-time monitoring includes:

- **User Metrics**: Total users, active users
- **Usage Stats**: API calls, translations, service usage
- **Performance**: Response times, uptime percentages
- **System Resources**: CPU, memory, disk usage
- **Recent Activity**: Live activity feed

### 🏥 System Health

Monitor system components:

- **Database**: Connection status and performance
- **API**: Health checks and response times
- **Storage**: Disk usage and file system status
- **External Services**: Clerk, OpenAI API status

## API Endpoints

### Admin Authentication

All admin endpoints require Bearer token authentication with admin role.

```
Authorization: Bearer <clerk_session_token>
```

### Environment Variables

```
GET /api/admin/env              # Get all environment variables
PUT /api/admin/env              # Update environment variables
```

### Service Configuration

```
GET /api/admin/services         # Get all service configurations
PUT /api/admin/services/:id     # Update specific service
```

### Statistics & Monitoring

```
GET /api/admin/stats           # Get live statistics
GET /api/admin/health          # Get system health status
```

## Security Considerations

1. **Role Verification**: Admin role is verified on every API call
2. **Token Validation**: Clerk tokens are validated server-side
3. **Environment Protection**: Sensitive variables are handled securely
4. **Audit Trail**: All admin actions should be logged (implement as needed)

## Customization

### Adding New Services

To add a new service to the admin panel:

1. Update the default services in `adminController.js`
2. Add the new service configuration
3. Update the frontend to handle the new service type

### Custom Statistics

To add custom statistics:

1. Implement new helper functions in `adminController.js`
2. Update the `getLiveStatistics` function
3. Add UI components in the admin dashboard

### Additional Environment Variables

New environment variables are automatically detected and can be added through the admin interface.

## Troubleshooting

### Admin Access Issues

1. **Check User Role**: Ensure the user has `role: "admin"` in Clerk metadata
2. **Token Issues**: Verify Clerk configuration and token validity
3. **Database Connection**: Check database credentials and connectivity

### Performance Issues

1. **Database Optimization**: Add indexes for frequently queried fields
2. **Caching**: Implement Redis or memory caching for statistics
3. **Rate Limiting**: Add rate limiting for admin endpoints

### Environment Variable Issues

1. **File Permissions**: Ensure the backend can write to `.env` file
2. **Server Restart**: Some environment changes require server restart
3. **Validation**: Implement validation for critical environment variables

## Development

### Adding New Admin Features

1. Create controller functions in `backend/controllers/adminController.js`
2. Add routes in `backend/routes/admin.js`
3. Update the admin API client in `src/lib/adminApi.ts`
4. Add UI components to `src/pages/Admin.tsx`

### Testing

```bash
# Test admin authentication
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/admin/health

# Test environment variables
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/admin/env
```

## Future Enhancements

- [ ] Audit logging for all admin actions
- [ ] Database backup and restore functionality
- [ ] Advanced user management
- [ ] System configuration export/import
- [ ] Performance analytics and alerts
- [ ] Scheduled tasks and maintenance