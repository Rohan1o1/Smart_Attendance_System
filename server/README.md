# Smart Attendance System - Backend

A comprehensive **Face Recognition + Location Verified Smart Attendance System** built with Node.js, Express.js, and MongoDB.

## 🚀 Features

### Core Features
- **Face Recognition Attendance** - AI-powered face detection and recognition
- **GPS Location Verification** - Location-based attendance validation with geofencing
- **Real-time Attendance Tracking** - Live attendance monitoring and updates
- **Multi-role Support** - Student, Teacher, and Admin dashboards
- **Secure Authentication** - JWT-based authentication with role-based access control

### Security Features
- **Liveness Detection** - Prevents photo spoofing attempts
- **GPS Anti-spoofing** - Advanced location validation algorithms
- **Rate Limiting** - Protection against brute force attacks
- **Input Validation** - Comprehensive data sanitization
- **Encrypted Storage** - Secure face embeddings and sensitive data encryption

### Advanced Features
- **Attendance Analytics** - Comprehensive reporting and insights
- **Bulk Operations** - Efficient batch processing
- **Real-time Notifications** - Email and SMS alerts
- **Geofencing** - Automated location boundary enforcement
- **Session Management** - Advanced class session controls

## 🛠️ Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Face Recognition:** face-api.js
- **Security:** bcrypt, helmet, cors
- **Validation:** Joi
- **File Upload:** multer
- **Logging:** winston
- **Testing:** Jest (planned)

## 📁 Project Structure

```
server/
├── controllers/          # Route controllers
│   ├── authController.js
│   ├── faceController.js
│   ├── classController.js
│   └── attendanceController.js
├── middleware/           # Custom middleware
│   ├── auth.js
│   ├── security.js
│   └── validation.js
├── models/              # Database models
│   ├── User.js
│   ├── Class.js
│   └── Attendance.js
├── routes/              # API routes
│   ├── auth.js
│   ├── face.js
│   ├── class.js
│   ├── attendance.js
│   └── index.js
├── services/            # Business logic
│   ├── faceRecognitionService.js
│   └── locationService.js
├── utils/               # Utility functions
│   ├── config.js
│   ├── constants.js
│   ├── helpers.js
│   └── logger.js
├── uploads/             # File uploads directory
├── logs/                # Application logs
├── .env                 # Environment variables
├── .gitignore
├── package.json
└── app.js               # Main application file
```

## 🔧 Installation

### Prerequisites
- Node.js 18 or higher
- MongoDB 5.0 or higher
- npm or yarn package manager

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AttendenceSys/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the server root directory:
   ```env
   # Application
   NODE_ENV=development
   PORT=5000
   APP_URL=http://localhost:5000
   FRONTEND_URL=http://localhost:3000

   # Database
   MONGODB_URI=mongodb://localhost:27017/attendance_system

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d

   # Security
   BCRYPT_ROUNDS=12
   MAX_LOGIN_ATTEMPTS=5
   LOCKOUT_DURATION=900000

   # File Upload
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=10485760

   # Face Recognition
   ENABLE_FACE_RECOGNITION=true
   FACE_MIN_CONFIDENCE=0.7
   FACE_MAX_DISTANCE=0.4

   # Location Services
   ENABLE_LOCATION_VERIFICATION=true
   LOCATION_MAX_DISTANCE=100
   GPS_ACCURACY_THRESHOLD=50

   # Email Configuration (optional)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=noreply@attendance-system.com

   # Logging
   LOG_LEVEL=info
   LOG_FILE_ENABLED=true
   LOG_CONSOLE_ENABLED=true

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX=100
   ```

4. **Create required directories**
   ```bash
   mkdir uploads logs
   mkdir uploads/profiles uploads/faces uploads/temp
   ```

5. **Download Face Recognition Models**
   ```bash
   # The application will automatically download required models on first run
   # Or manually download and place in ./models directory
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### With Process Manager (PM2)
```bash
npm install -g pm2
pm2 start app.js --name "attendance-api"
```

## 📚 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register     - User registration
POST   /api/auth/login        - User login
POST   /api/auth/logout       - User logout
POST   /api/auth/refresh      - Refresh JWT token
POST   /api/auth/forgot       - Forgot password
POST   /api/auth/reset        - Reset password
```

### Face Recognition Endpoints
```
POST   /api/face/upload       - Upload face image
POST   /api/face/verify       - Verify face for attendance
PUT    /api/face/update       - Update face data
DELETE /api/face/delete       - Delete face data
```

### Class Management Endpoints
```
GET    /api/classes           - List all classes
POST   /api/classes           - Create new class
GET    /api/classes/:id       - Get class details
PUT    /api/classes/:id       - Update class
DELETE /api/classes/:id       - Delete class
POST   /api/classes/:id/enroll - Enroll in class
POST   /api/classes/:id/start-session - Start attendance session
POST   /api/classes/:id/end-session   - End attendance session
```

### Attendance Endpoints
```
POST   /api/attendance/mark     - Mark attendance
GET    /api/attendance          - Get attendance records
GET    /api/attendance/report   - Generate attendance report
GET    /api/attendance/analytics - Get attendance analytics
GET    /api/attendance/export   - Export attendance data
```

## 🔐 Security Features

### Authentication & Authorization
- JWT-based stateless authentication
- Role-based access control (RBAC)
- Refresh token rotation
- Session management
- Account lockout protection

### Face Recognition Security
- Liveness detection to prevent photo attacks
- Face embedding encryption
- Confidence threshold validation
- Multi-factor verification support

### Location Security
- GPS accuracy validation
- Speed-based spoofing detection
- Geofencing with buffer zones
- Time-based location verification

### Data Protection
- Input sanitization and validation
- SQL injection protection
- XSS prevention
- CORS configuration
- Rate limiting
- Request size limits

## 📊 Monitoring & Logging

### Log Levels
- **Error:** Critical errors and exceptions
- **Warn:** Warning messages and security events
- **Info:** General application information
- **Debug:** Detailed debugging information

### Log Categories
- Authentication events
- Face recognition operations
- Location verification
- Attendance marking
- Security incidents
- Performance metrics
- Database operations

### Health Monitoring
```
GET /health              - Application health check
GET /health/detailed     - Detailed system status
```

## 🧪 Testing

### Run Tests
```bash
npm test                 # Run all tests
npm run test:unit       # Run unit tests
npm run test:integration # Run integration tests
npm run test:coverage   # Generate coverage report
```

### Test Categories
- Unit tests for utilities and services
- Integration tests for API endpoints
- Authentication flow tests
- Face recognition tests
- Location verification tests

## 🔧 Configuration

### Environment Variables
All configuration is managed through environment variables. See the `.env.example` file for complete configuration options.

### Feature Flags
Enable or disable features through environment variables:
- `ENABLE_FACE_RECOGNITION` - Face recognition features
- `ENABLE_LOCATION_VERIFICATION` - Location verification
- `ENABLE_EMAIL_NOTIFICATIONS` - Email notifications
- `FEATURE_REGISTRATION` - User registration
- `FEATURE_TWO_FACTOR_AUTH` - 2FA authentication

### Performance Tuning
- Database connection pooling
- Request rate limiting
- File upload size limits
- Cache configuration
- Logging levels

## 🚀 Deployment

### Docker Deployment
```bash
# Build Docker image
docker build -t attendance-api .

# Run container
docker run -d \
  --name attendance-api \
  -p 5000:5000 \
  --env-file .env \
  attendance-api
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure strong JWT secrets
- [ ] Set up MongoDB replica set
- [ ] Configure reverse proxy (nginx)
- [ ] Set up SSL/TLS certificates
- [ ] Configure log rotation
- [ ] Set up monitoring alerts
- [ ] Configure backup strategy

## 📈 Performance Optimization

### Database Optimization
- Proper indexing on frequently queried fields
- Connection pooling configuration
- Query optimization and aggregation pipelines

### API Performance
- Request caching for static data
- Compression middleware
- Optimized image processing
- Efficient pagination

### Face Recognition Optimization
- Model loading optimization
- Face embedding caching
- Batch processing for multiple faces

## 🔍 Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Check connection string format
   mongodb://username:password@host:port/database
   ```

2. **Face Recognition Model Loading**
   ```bash
   # Ensure models directory exists and has proper permissions
   mkdir -p models
   chmod 755 models
   ```

3. **File Upload Issues**
   ```bash
   # Check upload directory permissions
   mkdir -p uploads/profiles uploads/faces
   chmod 755 uploads -R
   ```

4. **JWT Token Issues**
   - Verify JWT secrets are set
   - Check token expiration times
   - Ensure proper token format

### Debug Mode
Enable debug logging by setting:
```env
LOG_LEVEL=debug
DEBUG_MODE=true
VERBOSE_LOGGING=true
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Style
- Use ESLint for code linting
- Follow Airbnb JavaScript style guide
- Add JSDoc comments for functions
- Maintain test coverage above 80%

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation
- Contact the development team

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Face recognition attendance system
- Location verification features
- Multi-role user management
- Comprehensive API endpoints
- Security and authentication features

---

**Made with ❤️ for modern attendance management**
