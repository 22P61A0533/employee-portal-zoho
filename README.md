# Custom Employee Portal with Zoho One Integration

A full-stack employee portal that provides secure authentication, role-based access control (RBAC), user management, audit logging, and centralized access to Zoho services through a backend integration.

## Project Overview

The Custom Employee Portal is designed to provide employees with a single web-based portal for accessing authorized organizational services.

The system uses custom authentication and role-based permissions to control what each user can access. Instead of requiring every employee to have separate Zoho credentials, the backend handles communication with Zoho services using centralized OAuth credentials.

The project was developed as a practical full-stack application using React, Node.js, Express, PostgreSQL, JWT authentication, and Zoho CRM API integration.

## Features

### Authentication

* Secure login using email and password
* Password hashing using bcrypt
* JWT-based authentication
* Protected API routes
* Token-based session management
* Automatic logout/session timeout handling
* Authentication validation on protected requests

### Role-Based Access Control

The application supports three primary roles:

| Role     | Access                                       |
| -------- | -------------------------------------------- |
| Admin    | Full system access                           |
| Manager  | Dashboard, users, and assigned Zoho services |
| Employee | Dashboard and assigned Zoho services         |

Permissions are stored separately from roles, allowing the system to be extended with additional roles and permissions.

### Admin Features

Administrators can:

* View users
* Create users
* Update user information
* Assign roles
* Delete users
* Manage permissions through role-permission mappings
* View audit logs
* Access available Zoho services

### Employee Features

Employees can:

* Log in securely
* View their dashboard
* Access only the services assigned to their role
* Access authorized Zoho CRM information through the portal

### Audit Logging

Important activities are recorded in the audit log, including:

* Login activity
* Administrative actions
* User management operations
* Role changes
* Zoho service access

Each log can contain the user, action, details, IP address, and timestamp.

## Zoho Integration

The portal uses OAuth-based integration with Zoho CRM.

The backend manages the Zoho OAuth credentials and communicates with the Zoho API on behalf of authorized users.

### Current Zoho CRM Integration

The application currently provides access to Zoho CRM Leads.

The CRM integration:

1. Authenticates the employee through the portal.
2. Checks the employee's permissions.
3. Sends the request to the backend.
4. The backend obtains/refreshes the Zoho access token.
5. The backend requests CRM data from Zoho.
6. Authorized CRM data is returned to the frontend.

Employees do not need to enter individual Zoho usernames and passwords.

## Technology Stack

### Frontend

* React.js
* Vite
* JavaScript
* HTML5
* CSS3

### Backend

* Node.js
* Express.js
* REST APIs
* JWT
* bcrypt
* Axios
* Helmet
* Express Rate Limit

### Database

* PostgreSQL

### External Integration

* Zoho CRM API
* Zoho OAuth 2.0

### Deployment

* Vercel - Frontend
* Render - Backend
* Render PostgreSQL - Database

## System Architecture

```text
                    ┌──────────────────────┐
                    │      Employee        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    React Frontend    │
                    │       Vercel         │
                    └──────────┬───────────┘
                               │
                         JWT Authentication
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Node.js + Express  │
                    │       Backend        │
                    │        Render        │
                    └──────┬─────────┬─────┘
                           │         │
                ┌──────────┘         └──────────────┐
                ▼                                   ▼
       ┌─────────────────┐                 ┌─────────────────┐
       │   PostgreSQL    │                 │    Zoho CRM     │
       │     Database    │                 │      API        │
       └─────────────────┘                 └─────────────────┘
```

## Database Design

The application uses PostgreSQL with the following main tables.

### Users

Stores employee account information.

Fields include:

* `id`
* `name`
* `email`
* `password`
* `status`
* `created_at`

### Roles

Stores application roles.

Examples:

* Admin
* Manager
* Employee

### Permissions

Stores individual application permissions.

Examples:

* `view_dashboard`
* `view_users`
* `manage_users`
* `manage_roles`
* `view_audit_logs`
* `access_people`
* `access_crm`
* `access_desk`
* `access_books`

### UserRoles

Maps users to their assigned roles.

```text
User → Role
```

### RolePermissions

Maps roles to their allowed permissions.

```text
Role → Permissions
```

### AuditLogs

Stores security and administrative activity.

Fields include:

* `id`
* `user_id`
* `action`
* `details`
* `ip_address`
* `created_at`

## Role and Permission Structure

The permission model follows this structure:

```text
Admin
 ├── view_dashboard
 ├── view_users
 ├── manage_users
 ├── manage_roles
 ├── view_audit_logs
 ├── access_people
 ├── access_crm
 ├── access_desk
 └── access_books

Manager
 ├── view_dashboard
 ├── view_users
 ├── access_people
 ├── access_crm
 └── access_desk

Employee
 ├── view_dashboard
 └── access_people
```

This structure allows permissions to be changed without modifying the application's authentication logic.

## API Endpoints

### Authentication

```text
POST /api/auth/login
```

Used to authenticate users and generate a JWT.

### Dashboard

```text
GET /api/dashboard
```

Protected endpoint for dashboard access.

### Admin - Users

```text
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
```

Used for user management.

### Admin - Roles

```text
PUT /api/admin/users/:id/role
```

Used to assign or update user roles.

### Admin - Audit Logs

```text
GET /api/admin/audit-logs
```

Used to retrieve audit log information.

### Zoho CRM

```text
GET /api/zoho/crm/leads
```

Returns Zoho CRM Leads for users with the required `access_crm` permission.

## Security

The project includes several security mechanisms:

* JWT authentication
* bcrypt password hashing
* Role-based authorization
* Permission-based API authorization
* Protected backend routes
* OAuth token handling on the backend
* Helmet security middleware
* Rate limiting
* CORS configuration
* Environment variables for secrets
* Audit logging
* Session timeout

Sensitive credentials and OAuth tokens are stored in environment variables and are not committed to the Git repository.

## Environment Variables

### Backend

Create a `.env` file inside the `backend` directory.

Example:

```env
PORT=5000

DB_USER=your_database_user
DB_HOST=your_database_host
DB_NAME=your_database_name
DB_PASSWORD=your_database_password
DB_PORT=5432

JWT_SECRET=your_jwt_secret

ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_zoho_refresh_token
```

Do not commit the actual `.env` file to GitHub.

### Frontend

The frontend can use:

```env
VITE_API_URL=http://localhost:5000
```

For production:

```env
VITE_API_URL=https://employee-portal-zoho.onrender.com
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/employee-portal-zoho.git
```

Navigate into the project:

```bash
cd employee-portal-zoho
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

Create the backend `.env` file and configure the required database, JWT, and Zoho OAuth variables.

### 3. Start the Backend

```bash
node server.js
```

The backend runs locally on:

```text
http://localhost:5000
```

### 4. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
```

### 5. Start the Frontend

```bash
npm run dev
```

The frontend will be available through the Vite development server.

## Production Deployment

### Backend

The backend is deployed using Render.

Production backend:

```text
https://employee-portal-zoho.onrender.com
```

### Frontend

The React frontend is deployed using Vercel.

Production frontend:

```text
https://employee-portal-zoho.vercel.app/
```

The frontend communicates with the deployed backend through the `VITE_API_URL` environment variable.

## Project Structure

```text
employee-portal-zoho/
│
├── backend/
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── admin.js
│   │   └── zoho.js
│   │
│   ├── services/
│   │   └── zohoService.js
│   │
│   ├── db.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── ...
│   │
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

## Authentication Flow

```text
User
  │
  ▼
Login Page
  │
  ▼
POST /api/auth/login
  │
  ▼
Validate Email & Password
  │
  ▼
Check User Role
  │
  ▼
Generate JWT
  │
  ▼
Frontend Stores Token
  │
  ▼
Protected API Requests
  │
  ▼
JWT Validation
  │
  ▼
Permission Validation
  │
  ▼
Allow / Deny Request
```

## Zoho CRM Request Flow

```text
Employee
   │
   ▼
React Frontend
   │
   ▼
JWT Protected Request
   │
   ▼
Express Backend
   │
   ▼
Check access_crm Permission
   │
   ▼
Zoho OAuth Token
   │
   ▼
Zoho CRM API
   │
   ▼
CRM Leads
   │
   ▼
React Dashboard
```

## Error Handling

The application handles common authentication and authorization errors including:

* Invalid login credentials
* Missing JWT token
* Invalid or expired JWT token
* Unauthorized role access
* Missing permissions
* Unauthorized Zoho service access
* Backend/API errors

HTTP status codes are used to communicate authentication and authorization failures.

## Future Enhancements

Possible future improvements include:

* Full integration with additional Zoho services such as Zoho People, Zoho Desk, and Zoho Books
* More granular feature-level permissions
* Password reset functionality
* Multi-factor authentication
* Advanced audit-log filtering
* User profile management
* Notification system
* Improved dashboard analytics
* Automated testing
* CI/CD pipeline
* Enhanced session management

## Learning Outcomes

This project provided practical experience with:

* Full-stack application development
* React.js and Vite
* Node.js and Express.js
* PostgreSQL database design
* REST API development
* JWT authentication
* Role-based access control
* Permission-based authorization
* OAuth 2.0 integration
* Third-party API integration
* Secure environment configuration
* Cloud deployment
* Git and GitHub

## Author

**Brahmani Reddy Billa**

This project was developed as a practical full-stack employee portal demonstrating authentication, authorization, database management, API integration, and cloud deployment.
