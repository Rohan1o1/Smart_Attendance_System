# Smart Attendance System - Login Credentials

## 🚀 Quick Start

Your Face Recognition + Location Verified Smart Attendance System is now running successfully!

### 🌐 Application URLs
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:5002

### 🔑 Login Credentials

#### Administrator Account
```
Email: admin@college.edu
Password: admin123
```
**Permissions**: Full system access, user management, attendance reports, settings

#### Teacher Account
```
Email: teacher1@college.edu
Password: teacher123
```
**Permissions**: View attendance, mark attendance, manage classes

#### Student Accounts
```
Student 1:
Email: student1@college.edu
Password: student123
Student ID: CS2021001

Student 2:
Email: student2@college.edu
Password: student123
Student ID: CS2021002
```
**Permissions**: Mark attendance, view own attendance records

## 📱 System Features

### 🧠 Face Recognition
- Real-time face detection and recognition
- Face enrollment for new users
- Anti-spoofing liveness detection
- Multiple face comparison algorithms

### 📍 Location Verification
- GPS-based location tracking
- Geofencing for attendance zones
- Location accuracy validation
- Speed and movement detection

### 🔐 Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting protection
- CORS security headers
- Input sanitization

### 📊 Attendance Management
- Real-time attendance marking
- Attendance history and reports
- Analytics and insights
- Bulk operations support

## 🛠️ Technical Details

### Backend (Port 5002)
- **Framework**: Express.js
- **Database**: MongoDB (attendance_system)
- **Authentication**: JWT tokens
- **Face Recognition**: face-api.js
- **File Upload**: Multer for image handling

### Frontend (Port 5174)
- **Framework**: React 19 with Vite
- **Styling**: TailwindCSS v3.4.0
- **Build Tool**: Vite v7.2.6
- **State Management**: React Context/Hooks

## 📋 User Roles & Permissions

| Feature | Admin | Teacher | Student |
|---------|-------|---------|---------|
| Mark Attendance | ✅ | ✅ | ✅ |
| View Own Attendance | ✅ | ✅ | ✅ |
| View All Attendance | ✅ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| Reports & Analytics | ✅ | ✅ | ❌ |
| Class Management | ✅ | ✅ | ❌ |

## 🔧 Configuration

### Environment Variables
The system uses the following key configurations:
- MongoDB URI: `mongodb://localhost:27017/attendance_system`
- JWT Secret: Configured for 7-day token expiration
- Face Recognition: Enabled with 70% confidence threshold
- Location Verification: Enabled with 100m radius

### Face Recognition Settings
- Minimum confidence: 0.7 (70%)
- Maximum distance: 0.4
- Face size range: 160px - 1024px
- Liveness threshold: 0.5

### Location Settings
- Maximum allowed distance: 100 meters
- GPS accuracy threshold: 50 meters
- Speed threshold: 100 km/h
- Time window: 5 minutes

## 🚨 Troubleshooting

### Common Issues:
1. **Login Failed**: Ensure you're using the correct email and password from above
2. **Face Recognition Not Working**: Allow camera permissions in browser
3. **Location Issues**: Enable location services in browser settings
4. **Server Errors**: Check if both frontend (5174) and backend (5002) are running

### Need Help?
- Check browser console for error messages
- Ensure camera and location permissions are granted
- Verify both servers are running without errors

## 🎯 Next Steps

1. **Login** with any of the provided credentials
2. **Test Face Recognition** by allowing camera access
3. **Enable Location Services** for location-based attendance
4. **Create Additional Users** through the admin panel
5. **Set Up Classes** and attendance schedules
6. **Start Marking Attendance** with face and location verification

---

**Happy Attendance Tracking!** 🎉
