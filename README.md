# Ithra Contract Management Platform

A comprehensive full-stack contract management platform developed for schools to perform CRUD operations on student contracts. The system generates Word document templates with dynamic placeholders, supports automated distribution via email and WhatsApp, and includes multi-contract type management with role-based access control.

## 🚀 Features

### Core Functionality
- **Contract Management**: Complete CRUD operations for student contracts
- **Dynamic Document Generation**: Word document templates with dynamic placeholders
- **Multi-Contract Types**: Support for different contract types and academic years
- **Role-Based Access Control**: Granular permission management for different administrative functions
- **Automated Distribution**: Email and WhatsApp integration for contract distribution
- **Student Information Management**: Comprehensive student and guardian data tracking
- **Payment Tracking**: Transportation and payment type management

### Technical Features
- **Real-time Document Generation**: Dynamic Word document creation with docxtemplater
- **Secure Authentication**: JWT-based authentication with HTTP-only cookies
- **File Upload Management**: Multer-based file handling for document uploads
- **Database Management**: MongoDB with Mongoose ODM
- **API Security**: CORS configuration and input validation
- **Deployment Ready**: Vercel deployment configuration

## 🏗️ Architecture

### Backend (Node.js/Express)
```
back/
├── app.js                 # Main server file
├── models/               # MongoDB schemas
│   ├── user.js          # User authentication model
│   ├── contract.js      # Contract data model
│   └── contractVariables.js # Contract template variables
├── controller/          # Business logic
│   ├── userController.js    # User and contract operations
│   ├── contractController.js # Contract template management
│   └── roleMiddleware.js    # Authentication middleware
├── router/             # API routes
│   ├── userRoute.js    # User and contract routes
│   └── contractRoute.js # Contract variables routes
├── utils/              # Utility functions
│   └── connect.js      # Database connection
├── files/              # Document templates
└── uploads/            # File upload directory
```

### Frontend (React)
```
front/
├── src/
│   ├── pages/          # Application pages
│   │   ├── welcome/    # Landing page
│   │   ├── login/      # Authentication
│   │   ├── create/     # Contract creation
│   │   ├── allStudents/ # Contract management
│   │   ├── edit/       # Contract editing
│   │   └── CreateAdmin/ # Admin management
│   ├── compnents/      # Reusable components
│   │   └── create/     # Contract form components
│   ├── common/         # Shared components
│   │   ├── Header.jsx  # Navigation header
│   │   ├── Footer.jsx  # Footer component
│   │   ├── protectRoute.jsx # Route protection
│   │   └── SuperAdminRoute.jsx # Admin route protection
│   └── assets/         # Static assets
└── public/             # Public assets
```

## 🛠️ Technology Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: Object Data Modeling
- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing
- **multer**: File upload handling
- **nodemailer**: Email functionality
- **twilio**: WhatsApp integration
- **docxtemplater**: Word document generation
- **moment-hijri**: Hijri calendar support

### Frontend
- **React**: Frontend framework
- **React Router**: Client-side routing
- **Material-UI**: UI component library
- **Bootstrap**: CSS framework
- **Formik**: Form management
- **Yup**: Form validation
- **Axios**: HTTP client
- **FontAwesome**: Icon library

### Deployment
- **Vercel**: Hosting platform
- **MongoDB Atlas**: Cloud database

## 📋 Prerequisites

Before running this project, ensure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas connection)
- Git

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Ithra
```

### 2. Backend Setup
```bash
cd back
npm install
```

Create a `.env` file in the `back` directory:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin_password
CORS_ORIGIN=http://localhost:3000
PORT=3080
```

### 3. Frontend Setup
```bash
cd front
npm install
```

Create a `.env` file in the `front` directory:
```env
REACT_APP_API_URL=http://localhost:3080
```

### 4. Database Setup
Ensure your MongoDB instance is running and accessible. The application will automatically create the necessary collections and indexes.

### 5. Start Development Servers

#### Backend
```bash
cd back
npm start
```
The backend will run on `http://localhost:3080`

#### Frontend
```bash
cd front
npm start
```
The frontend will run on `http://localhost:3000`

## 🔐 Authentication & Authorization

### User Roles
- **Super Admin**: Full system access including admin management
- **Admin**: Contract management and viewing capabilities

### Authentication Flow
1. Users login with email/password
2. JWT token stored in HTTP-only cookie
3. Role-based middleware protects routes
4. Automatic token validation on protected routes

## 📄 Contract Management

### Contract Structure
Each contract includes:
- **Guardian Information**: Name, ID, contact details, address
- **Student Information**: Personal details, academic history
- **Contract Editor**: Legal representative information
- **Payment Details**: Transportation and payment type
- **Academic Year**: Contract period specification

### Document Generation
- Dynamic Word document templates
- Placeholder replacement with contract data
- Support for Arabic text and Hijri dates
- Automated file naming and organization

## 📧 Communication Features

### Email Integration
- Automated contract email distribution
- Customizable email templates
- File attachment support
- Delivery confirmation

### WhatsApp Integration
- Automated WhatsApp message sending
- File sharing capabilities
- Message delivery tracking
- Contact management

## 🚀 Deployment

### Vercel Deployment
The project is configured for Vercel deployment with:
- Automatic build process
- Environment variable management
- Static file serving
- API route handling

### Environment Variables for Production
```env
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password
CORS_ORIGIN=your_frontend_domain
```

## 🔧 API Endpoints

### Authentication
- `POST /api/admin/loginforadmin` - User login
- `GET /api/auth-check` - Authentication verification

### Contract Management
- `POST /api/user/create` - Create new contract
- `GET /api/admin/ViewContarcts` - View all contracts
- `GET /api/admin/get/:id` - Get specific contract
- `PUT /api/admin/edit/:id` - Edit contract (Super Admin)
- `DELETE /api/admin/delete/:id` - Delete contract (Super Admin)

### Document Operations
- `GET /api/admin/print/:id` - Generate contract document
- `POST /api/send-email` - Send contract via email
- `POST /api/send-whatsapp` - Send contract via WhatsApp

### Admin Management (Super Admin Only)
- `POST /api/admin/create-admin` - Create new admin
- `GET /api/admin/get-admins` - List all admins
- `PUT /api/admin/edit-admin/:id` - Edit admin
- `DELETE /api/admin/delete-admin/:id` - Delete admin

### Contract Variables (Super Admin Only)
- `POST /api/contract-variables` - Create contract variables
- `GET /api/contract-variables` - Get contract variables
- `PUT /api/contract-variables/:id` - Update contract variables
- `DELETE /api/contract-variables/:id` - Delete contract variables

## 🛡️ Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Granular permission system
- **Input Validation**: Express-validator for data validation
- **CORS Protection**: Cross-origin resource sharing configuration
- **HTTP-Only Cookies**: Secure cookie storage

## 📱 User Interface

### Features
- **Responsive Design**: Mobile and desktop compatible
- **Arabic RTL Support**: Right-to-left text direction
- **Modern UI**: Material-UI and Bootstrap components
- **Form Validation**: Real-time input validation
- **Loading States**: User feedback during operations
- **Error Handling**: Comprehensive error messages

### Pages
- **Welcome Page**: Landing page with company information
- **Login Page**: Authentication interface
- **Contract Creation**: Multi-step contract form
- **Contract Management**: List and manage contracts
- **Admin Management**: User administration (Super Admin)
- **Contract Variables**: Template management (Super Admin)

## 🔄 Workflow

1. **Contract Creation**: Admin creates new student contract
2. **Data Entry**: Fill in guardian, student, and payment information
3. **Document Generation**: System generates Word document with dynamic data
4. **Review & Edit**: Admin reviews and edits contract details
5. **Distribution**: Send contract via email or WhatsApp
6. **Management**: Track and manage all contracts in the system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions, please contact the development team.

---

**Developed for Ithra Education Company** - Building productive individuals through innovative educational technology. 