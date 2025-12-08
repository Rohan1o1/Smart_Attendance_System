# Face Recognition + Location Verified Smart Attendance System

A comprehensive MERN stack application that combines facial recognition and GPS location verification to create a secure and reliable attendance tracking system for educational institutions.

## 🚀 Features

### Core Features
- **Face Recognition Authentication**: Secure login using facial biometrics
- **GPS Location Verification**: Ensures attendance is marked from authorized locations
- **Multi-Role Support**: Student, Teacher, and Admin dashboards
- **Real-time Attendance Tracking**: Live attendance sessions with instant verification
- **Comprehensive Analytics**: Detailed reports and attendance statistics
- **Mobile Responsive**: Works seamlessly across devices

### Technical Features
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Rate Limiting**: Protection against brute force attacks
- **Image Processing**: Advanced image quality validation and face detection
- **Geofencing**: Location-based access control with anti-spoofing
- **RESTful API**: Well-structured API with comprehensive error handling
- **Database Indexing**: Optimized MongoDB queries for performance

## 🛠️ Technology Stack

### Frontend
- **React 19**: Modern React with hooks and context API
- **Vite**: Fast build tool and development server
- **TailwindCSS**: Utility-first CSS framework
- **Lucide React**: Beautiful SVG icons
- **React Router Dom**: Client-side routing
- **React Hook Form + Zod**: Form management and validation
- **Axios**: HTTP client with interceptors
- **React Hot Toast**: User notifications

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: JSON Web Tokens for authentication
- **Bcrypt.js**: Password hashing
- **Multer**: File upload handling
- **Sharp**: Image processing
- **Helmet**: Security middleware
- **Rate Limiting**: Request rate limiting

### Additional Tools
- **face-api.js**: Browser-based face recognition (planned)
- **React Webcam**: Camera access for face capture
- **Geolocation API**: GPS location services

## 📁 Project Structure

```
AttendenceSys/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── auth/      # Authentication components
│   │   │   ├── common/    # Common UI components
│   │   │   └── layout/    # Layout components
│   │   ├── pages/         # Page components
│   │   │   ├── student/   # Student-specific pages
│   │   │   ├── teacher/   # Teacher-specific pages
│   │   │   ├── admin/     # Admin-specific pages
│   │   │   └── error/     # Error pages
│   │   ├── services/      # API services and utilities
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
│
└── server/                # Backend Express application
    ├── controllers/       # Route controllers
    ├── models/           # MongoDB schemas
    ├── routes/           # API route definitions
    ├── middleware/       # Custom middleware
    ├── services/         # Business logic services
    ├── utils/            # Utility functions
    ├── uploads/          # File upload directory
    ├── .env.example      # Environment variables template
    └── package.json      # Backend dependencies
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AttendenceSys
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env file with your configuration
   npm start
   ```

3. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

### Environment Configuration

Copy `server/.env.example` to `server/.env` and update the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/attendance_system

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Location Configuration
COLLEGE_LATITUDE=28.6139
COLLEGE_LONGITUDE=77.2090
COLLEGE_GEOFENCE_RADIUS=200

# Face Recognition
FACE_SIMILARITY_THRESHOLD=0.6
MAX_FACE_IMAGES=5
```

## 📱 User Roles & Features

### 👨‍🎓 Student Dashboard
- View personal attendance statistics
- Mark attendance using face + location verification
- View class schedules and enrolled subjects
- Access attendance history and reports
- Update profile information

### 👨‍🏫 Teacher Dashboard
- Start and manage attendance sessions
- View class rosters and student attendance
- Generate attendance reports
- Monitor real-time attendance marking
- Manage class schedules

### 👨‍💼 Admin Dashboard
- Comprehensive system overview
- User management (students, teachers)
- System analytics and reports
- Configuration management
- Security monitoring

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with configurable rounds
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive data validation
- **CORS Configuration**: Cross-origin resource sharing control
- **Helmet Security**: HTTP security headers
- **File Upload Security**: Type and size validation

## 📊 API Documentation

The API follows RESTful conventions with the following base structure:

```
GET    /api/auth/profile          # Get user profile
POST   /api/auth/login            # User login
POST   /api/auth/register         # User registration
POST   /api/auth/logout           # User logout
POST   /api/auth/refresh          # Refresh access token

GET    /api/users/profile         # Get user profile
PUT    /api/users/profile         # Update user profile
POST   /api/users/profile/image   # Upload profile image

POST   /api/face/register         # Register face for user
POST   /api/face/verify           # Verify face for attendance
GET    /api/face/quality          # Check image quality

GET    /api/classes               # Get user's classes
POST   /api/classes               # Create new class (teacher/admin)
GET    /api/classes/:id           # Get class details
PUT    /api/classes/:id           # Update class

POST   /api/attendance/mark       # Mark attendance
GET    /api/attendance/session    # Get attendance session
POST   /api/attendance/session    # Start attendance session
PUT    /api/attendance/session    # End attendance session
```

## 🚀 Development Status

### ✅ Completed
- [x] Complete backend API with authentication
- [x] Frontend React application setup
- [x] User authentication system
- [x] Role-based access control
- [x] Responsive UI with TailwindCSS
- [x] API service layer with error handling
- [x] Basic dashboard interfaces
- [x] Profile management
- [x] Protected routing system

### 🚧 In Progress
- [ ] Face recognition integration (face-api.js)
- [ ] GPS location services implementation
- [ ] Webcam capture functionality
- [ ] Attendance marking workflow
- [ ] Real-time session management

### 📋 Planned Features
- [ ] Advanced analytics dashboard
- [ ] Report generation (PDF/Excel)
- [ ] Email notifications
- [ ] Mobile application
- [ ] Biometric alternatives (fingerprint)
- [ ] Multi-language support
- [ ] Dark/light theme toggle

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests (to be implemented)
cd client
npm test
```

## 📦 Deployment

### Production Build

1. **Build Frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Configure Environment**
   - Update production environment variables
   - Set up MongoDB production database
   - Configure domain and SSL certificates

3. **Deploy Backend**
   - Use PM2 for process management
   - Set up reverse proxy (Nginx)
   - Configure SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: Your Name
- **Institution**: Your College/University
- **Project Type**: Final Year Project

## 📞 Support

For support and questions:
- Email: your-email@example.com
- GitHub Issues: [Create an issue](../../issues)

---

**Note**: This is an academic project developed as part of a final year computer science program. The face recognition and location verification features are designed for educational purposes and should be thoroughly tested and enhanced for production use.
