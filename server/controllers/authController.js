const User = require("../models/User");
const { generateToken, generateRefreshToken } = require("../middleware/auth");
const config = require("../config");

/**
 * Authentication Controller
 * Handles user registration, login, and related authentication operations
 */

/**
 * Register a new Admin (Department Head)
 * Department must be NEW (not already registered)
 * POST /auth/register/admin
 */
const registerAdmin = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      department,
      adminId,
      phone,
      phoneNumber,
    } = req.body;

    // Validate admin ID format (8-12 digits)
    if (!adminId || !/^\d{8,12}$/.test(adminId)) {
      return res.status(400).json({
        success: false,
        message: "Admin ID must be 8-12 digits",
      });
    }

    // Check if department already exists (Admin can only register NEW department)
    const departmentExists = await User.departmentExists(department);
    if (departmentExists) {
      return res.status(400).json({
        success: false,
        message:
          "This department already has an admin. Please contact existing admin or choose a different department.",
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Check if admin ID already exists
    const existingAdminId = await User.findOne({ adminId });
    if (existingAdminId) {
      return res.status(400).json({
        success: false,
        message: "This Admin ID is already in use",
      });
    }

    // Create admin user (no verification needed)
    const admin = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      // prefer explicit phoneNumber, fallback to phone for older clients
      phoneNumber: phoneNumber || phone,
      department,
      adminId,
      role: "admin",
      verified: true, // Admin is automatically verified
    });

    await admin.save();

    // Generate tokens
    const token = generateToken(admin._id, admin.role);
    const refreshToken = generateRefreshToken(admin._id);

    admin.password = undefined;

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: {
        user: admin,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    handleRegistrationError(error, res);
  }
};

/**
 * Register a new Teacher
 * Department must EXIST (must have an admin)
 * Account needs verification by admin before login
 * POST /auth/register/teacher
 */
const registerTeacher = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      department,
      teacherId,
      phone,
      phoneNumber,
    } = req.body;

    // Validate teacher ID format (8-12 digits)
    if (!teacherId || !/^\d{8,12}$/.test(teacherId)) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID must be 8-12 digits",
      });
    }

    // Check if department exists (Teacher must use existing department)
    const departmentExists = await User.departmentExists(department);
    if (!departmentExists) {
      return res.status(400).json({
        success: false,
        message:
          "This department does not exist. Please contact your department admin or select an existing department.",
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Check if teacher ID already exists
    const existingTeacherId = await User.findOne({ teacherId });
    if (existingTeacherId) {
      return res.status(400).json({
        success: false,
        message: "This Teacher ID is already in use",
      });
    }

    // Create teacher user (needs verification)
    const teacher = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phoneNumber: phoneNumber || phone,
      department,
      teacherId,
      role: "teacher",
      verified: false, // Needs admin verification
    });

    await teacher.save();

    teacher.password = undefined;

    res.status(201).json({
      success: true,
      message:
        "Teacher registered successfully. Please wait for admin verification before logging in.",
      data: {
        user: teacher,
        requiresVerification: true,
      },
    });
  } catch (error) {
    console.error("Teacher registration error:", error);
    handleRegistrationError(error, res);
  }
};

/**
 * Register a new Student
 * Department must EXIST (must have an admin)
 * Account needs verification by admin before login
 * POST /auth/register/student
 */
const registerStudent = async (req, res) => {
  try {
    // Accept either { firstName, lastName } or legacy { name }
    // Accept year as number or legacy strings like '4th Year'
    let {
      firstName,
      lastName,
      name,
      email,
      password,
      department,
      year,
      semester,
      section,
      rollNumber,
      phone,
      phoneNumber,
    } = req.body;

    // If client sent a single `name`, split into firstName/lastName
    if ((!firstName || !lastName) && name && typeof name === "string") {
      const parts = name.trim().split(/\s+/);
      firstName = firstName || parts.shift() || "";
      lastName = lastName || parts.join(" ") || "";
    }

    // Coerce year when it's a string like '4th Year' -> 4
    if (typeof year === "string") {
      const m = year.match(/\d+/);
      if (m) {
        year = parseInt(m[0], 10);
      }
    }

    // Coerce semester if string numeric
    if (typeof semester === "string" && /^\d+$/.test(semester)) {
      semester = parseInt(semester, 10);
    }

    // Provide a safe default for semester if missing (fallback to 1)
    if (!semester) {
      semester = 1;
    }

    // Validate roll number format (8-12 digits)
    if (!rollNumber || !/^\d{8,12}$/.test(rollNumber)) {
      return res.status(400).json({
        success: false,
        message: "Roll number must be 8-12 digits",
      });
    }

    // Check if department exists (Student must use existing department)
    const departmentExists = await User.departmentExists(department);
    if (!departmentExists) {
      return res.status(400).json({
        success: false,
        message:
          "This department does not exist. Please contact your department admin or select an existing department.",
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Check if roll number already exists
    const existingRollNumber = await User.findOne({ rollNumber });
    if (existingRollNumber) {
      return res.status(400).json({
        success: false,
        message: "This roll number is already registered",
      });
    }

    // Generate studentId
    const studentId = await User.generateStudentId(department, year);

    // Create student user (needs verification)
    const student = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phoneNumber: phoneNumber || phone,
      department,
      year,
      semester,
      section,
      rollNumber,
      studentId,
      role: "student",
      verified: false, // Needs admin verification
    });

    await student.save();

    student.password = undefined;

    res.status(201).json({
      success: true,
      message:
        "Student registered successfully. Please wait for admin verification before logging in.",
      data: {
        user: student,
        requiresVerification: true,
      },
    });
  } catch (error) {
    console.error("Student registration error:", error);
    handleRegistrationError(error, res);
  }
};

/**
 * Get all departments (for registration dropdown)
 * GET /auth/departments
 */
const getDepartments = async (req, res) => {
  try {
    console.log("GET /auth/departments - handler entered");
    const departments = await User.getAllDepartments();
    console.log(
      "GET /auth/departments - fetched departments count:",
      Array.isArray(departments) ? departments.length : typeof departments,
    );
    res.json({
      success: true,
      data: { departments },
    });
  } catch (error) {
    console.error(
      "Get departments error:",
      error && error.stack ? error.stack : error,
    );
    // Defensive fallback: return empty departments array on transient DB errors
    return res.json({
      success: true,
      data: { departments: [] },
    });
  }
};

/**
 * Student login with roll number
 * POST /auth/login/student
 */
const loginStudent = async (req, res) => {
  try {
    const { rollNumber, password } = req.body;

    if (!rollNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Roll number and password are required",
      });
    }

    const user = await User.findByRollNumber(rollNumber, password);

    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    await user.updateOne({ lastLogin: new Date() });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user,
        accessToken: token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Student login error:", error);
    res.status(401).json({
      success: false,
      message: error.message || "Invalid roll number or password",
    });
  }
};

/**
 * Helper function to handle registration errors
 */
const handleRegistrationError = (error, res) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors,
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error during registration",
  });
};

/**
 * Register a new user (legacy - supports all roles)
 * POST /auth/register
 */
const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      role,
      department,
      semester,
      studentId,
      employeeId,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create user data object
    const userData = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phoneNumber,
      role,
    };

    // Add role-specific fields
    if (role === "student") {
      userData.department = department;
      userData.semester = semester;

      // Generate student ID if not provided
      if (studentId) {
        // Check if student ID is already taken
        const existingStudent = await User.findOne({
          studentId,
          role: "student",
        });
        if (existingStudent) {
          return res.status(400).json({
            success: false,
            message: "Student ID already exists",
          });
        }
        userData.studentId = studentId;
      } else {
        userData.studentId = await User.generateStudentId(department);
      }
    }

    if (role === "teacher") {
      userData.department = department;

      // Generate employee ID if not provided
      if (employeeId) {
        // Check if employee ID is already taken
        const existingTeacher = await User.findOne({
          employeeId,
          role: "teacher",
        });
        if (existingTeacher) {
          return res.status(400).json({
            success: false,
            message: "Employee ID already exists",
          });
        }
        userData.employeeId = employeeId;
      } else {
        userData.employeeId = await User.generateEmployeeId(department);
      }
    }

    // Create user
    const user = new User(userData);
    await user.save();

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Remove password from user object
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
};

/**
 * Login user
 * POST /auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Defensive logging to help diagnose 500 errors seen by clients
    console.debug("Login route hit - body:", {
      email: email || null,
      passwordLength: password ? password.length : 0,
    });

    // Find user by credentials
    const user = await User.findByCredentials(email, password);

    console.log("User found:", user.email, "Role:", user.role);

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Update last login
    await user.updateOne({ lastLogin: new Date() });

    // Sanitize user object (remove sensitive fields)
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.faceEmbeddings;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userObj,
        accessToken: token,
        refreshToken,
      },
    });
  } catch (error) {
    // Log full error including stack for diagnosis
    console.error("Login error:", error);
    console.error(error && error.stack ? error.stack : "no stack available");

    // Return 500 with stack in development so client sees diagnostic info
    const statusCode = 500;
    const payload = {
      success: false,
      message: error.message || "Internal server error during login",
    };

    if (
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === undefined
    ) {
      payload.stack = error && error.stack ? error.stack : undefined;
      // Include a safe error summary to avoid circular JSON serialization
      payload.error = {
        name: error && error.name ? error.name : undefined,
        message: error && error.message ? error.message : undefined,
        code: error && error.code ? error.code : undefined,
      };
    }

    return res.status(statusCode).json(payload);
  }
};

/**
 * Get current user profile
 * GET /auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
};

/**
 * Update user profile
 * PUT /auth/me
 */
const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ["firstName", "lastName", "phoneNumber"];

    // Add role-specific allowed updates
    if (req.user.role === "student") {
      allowedUpdates.push("semester");
    }

    // Filter out non-allowed updates
    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid updates provided",
      });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

/**
 * Change password
 * PUT /auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password field
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

/**
 * Refresh authentication token
 * POST /auth/refresh
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    const { verifyToken } = require("../middleware/auth");
    const decoded = await verifyToken(refreshToken);

    if (decoded.type !== "refresh") {
      return res.status(400).json({
        success: false,
        message: "Invalid refresh token type",
      });
    }

    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newToken,
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

/**
 * Logout user
 * POST /auth/logout
 */
const logout = async (req, res) => {
  try {
    // In a production environment, you might want to blacklist the token
    // For now, we'll just return a success response
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to logout",
    });
  }
};

/**
 * Get user statistics (for admins)
 * GET /auth/stats
 */
const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalUsers = await User.countDocuments({ isActive: true });
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        recentUsers,
        roleDistribution: stats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user statistics",
    });
  }
};

/**
 * Deactivate user account (for admins)
 * PUT /auth/deactivate/:id
 */
const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy: req.user._id,
        deactivationReason: reason,
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User account deactivated successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Deactivate user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate user account",
    });
  }
};

/**
 * Reactivate user account (for admins)
 * PUT /auth/reactivate/:id
 */
const reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      {
        isActive: true,
        $unset: { deactivatedAt: 1, deactivatedBy: 1, deactivationReason: 1 },
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User account reactivated successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Reactivate user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reactivate user account",
    });
  }
};

/**
 * Admin: Get unverified users in department
 * GET /auth/admin/unverified
 */
const getUnverifiedUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access this endpoint",
      });
    }

    const unverifiedUsers = await User.getUnverifiedUsers(req.user.department);

    res.json({
      success: true,
      data: {
        users: unverifiedUsers,
        count: unverifiedUsers.length,
      },
    });
  } catch (error) {
    console.error("Get unverified users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unverified users",
    });
  }
};

/**
 * Admin: Verify a teacher or student
 * PUT /auth/admin/verify/:userId
 */
const verifyUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can verify users",
      });
    }

    // Route uses :id; accept either :id or legacy :userId for compatibility
    const userId = req.params.id || req.params.userId;

    // Get the user to verify
    const userToVerify = await User.findById(userId);

    if (!userToVerify) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is in the same department
    if (userToVerify.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: "You can only verify users in your department",
      });
    }

    const verifiedUser = await User.verifyUser(userId, req.user._id);

    res.json({
      success: true,
      message: `${verifiedUser.role} verified successfully`,
      data: { user: verifiedUser },
    });
  } catch (error) {
    console.error("Verify user error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify user",
    });
  }
};

/**
 * Admin: Get department users (teachers and students)
 * GET /auth/admin/users
 */
const getDepartmentUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access this endpoint",
      });
    }

    const { role, verified } = req.query;
    const includeInactive = req.query.includeInactive === "true";

    const query = {
      department: req.user.department,
      role: { $in: ["teacher", "student"] },
    };

    if (!includeInactive) {
      query.isActive = true;
    }

    if (role && ["teacher", "student"].includes(role)) {
      query.role = role;
    }

    if (verified !== undefined) {
      query.verified = verified === "true";
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        users,
        count: users.length,
      },
    });
  } catch (error) {
    console.error("Get department users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch department users",
    });
  }
};

/**
 * Admin: Assign teacher to year/section
 * PUT /auth/admin/assign-teacher/:teacherId
 */
const assignTeacher = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can assign teachers",
      });
    }

    const { teacherId } = req.params;
    const { year, semester, section } = req.body;

    const teacher = await User.findOne({
      _id: teacherId,
      role: "teacher",
      department: req.user.department,
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found in your department",
      });
    }

    teacher.assignedYear = year;
    teacher.assignedSemester = semester;
    teacher.assignedSection = section ? String(section).trim().toUpperCase() : undefined;
    await teacher.save();

    res.json({
      success: true,
      message: "Teacher assigned successfully",
      data: { teacher },
    });
  } catch (error) {
    console.error("Assign teacher error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign teacher",
    });
  }
};

// ============================
// SuperAdmin Functions
// ============================

/**
 * SuperAdmin: Get all admins
 * GET /auth/superadmin/admins
 */
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        admins,
        count: admins.length,
      },
    });
  } catch (error) {
    console.error("Get all admins error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admins",
    });
  }
};

/**
 * SuperAdmin: Create a new admin
 * POST /auth/superadmin/create-admin
 */
const createAdmin = async (req, res) => {
  try {
    // Accept either a single `name` or `firstName`/`lastName`
    let { name, firstName, lastName, email, password, department, phone, phoneNumber, employeeId, adminId } = req.body;

    // Normalize phone field
    phoneNumber = phoneNumber || phone;

    // If single name provided, split into first/last
    if ((!firstName || !lastName) && name && typeof name === 'string') {
      const parts = name.trim().split(/\s+/);
      firstName = firstName || parts.shift() || '';
      lastName = lastName || parts.join(' ') || '';
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !department) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, password, and department are required",
      });
    }

    // Basic email format check to provide faster, clearer errors
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Password length check (mirror schema requirement)
    const minPasswordLength = config.validation && config.validation.minPasswordLength ? config.validation.minPasswordLength : 8;
    if (!password || String(password).length < minPasswordLength) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${minPasswordLength} characters long`,
      });
    }

    // Prefer explicit adminId param, fallback to employeeId for backwards compatibility
    adminId = adminId || employeeId;

    // Validate adminId format if provided
    if (!adminId || !/^\d{8,12}$/.test(adminId)) {
      return res.status(400).json({
        success: false,
        message: "Admin ID (adminId or employeeId) must be 8-12 digits",
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Check if department already has an admin
    const departmentExists = await User.departmentExists(department);
    if (departmentExists) {
      return res.status(400).json({
        success: false,
        message: `Department "${department}" already has an admin. Each department can only have one admin.`,
      });
    }

    // Create admin user (map fields to schema)
    const admin = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      password,
      department: department.trim(),
      phoneNumber,
      adminId,
      role: "admin",
      verified: true, // SuperAdmin-created admins are auto-verified
      isActive: true,
    });

    await admin.save();

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      success: true,
      message: `Admin created successfully for department "${department}"`,
      data: { admin: adminResponse },
    });
  } catch (error) {
    console.error("Create admin error:", error && error.stack ? error.stack : error);

    // Surface validation and duplicate key errors to client
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(400).json({ success: false, message: `${field} already exists` });
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: "Validation error", errors });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create admin",
    });
  }
};

/**
 * SuperAdmin: Delete an admin
 * DELETE /auth/superadmin/admin/:id
 */
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await User.findOne({ _id: id, role: "admin" });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Soft delete - deactivate instead of removing
    admin.isActive = false;
    admin.deactivatedAt = new Date();
    admin.deactivatedBy = req.user._id;
    admin.deactivationReason = "Removed by SuperAdmin";
    await admin.save();

    res.json({
      success: true,
      message: `Admin for department "${admin.department}" has been deactivated`,
      data: { admin },
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete admin",
    });
  }
};

/**
 * SuperAdmin: Get all users across all departments
 * GET /auth/superadmin/users
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, department, verified, page = 1, limit = 50 } = req.query;

    const query = { role: { $ne: "superadmin" } }; // Exclude superadmins

    if (role && ["admin", "teacher", "student"].includes(role)) {
      query.role = role;
    }

    if (department) {
      query.department = department;
    }

    if (verified !== undefined) {
      query.verified = verified === "true";
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

/**
 * SuperAdmin: Get system statistics
 * GET /auth/superadmin/stats
 */
const getSystemStats = async (req, res) => {
  try {
    const [
      totalAdmins,
      totalTeachers,
      totalStudents,
      unverifiedTeachers,
      unverifiedStudents,
      departments,
    ] = await Promise.all([
      User.countDocuments({ role: "admin", isActive: true }),
      User.countDocuments({ role: "teacher", isActive: true }),
      User.countDocuments({ role: "student", isActive: true }),
      User.countDocuments({ role: "teacher", verified: false, isActive: true }),
      User.countDocuments({ role: "student", verified: false, isActive: true }),
      User.getAllDepartments(),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalAdmins,
          totalTeachers,
          totalStudents,
          unverifiedTeachers,
          unverifiedStudents,
          totalDepartments: departments.length,
        },
        departments,
      },
    });
  } catch (error) {
    console.error("Get system stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch system statistics",
    });
  }
};

/**
 * Admin: Reject a teacher or student (mark as inactive with rejection reason)
 * PUT /auth/admin/reject/:userId
 */
const rejectUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can reject users",
      });
    }

    // Route uses :id; accept either :id or legacy :userId for compatibility
    const userId = req.params.id || req.params.userId;
    const { reason } = req.body;

    const userToReject = await User.findById(userId);
    if (!userToReject) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (userToReject.department !== req.user.department) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You can only reject users in your department",
        });
    }

    // Soft-reject the user
    userToReject.isActive = false;
    userToReject.deactivatedAt = new Date();
    userToReject.deactivatedBy = req.user._id;
    userToReject.deactivationReason = reason || "Rejected by admin";
    await userToReject.save();

    res.json({
      success: true,
      message: "User rejected successfully",
      data: { user: userToReject },
    });
  } catch (error) {
    console.error("Reject user error:", error);
    res.status(500).json({ success: false, message: "Failed to reject user" });
  }
};

module.exports = {
  register,
  registerAdmin,
  registerTeacher,
  registerStudent,
  login,
  loginStudent,
  getDepartments,
  getMe,
  updateProfile,
  changePassword,
  refreshToken,
  logout,
  getUserStats,
  deactivateUser,
  reactivateUser,
  getUnverifiedUsers,
  verifyUser,
  getDepartmentUsers,
  assignTeacher,
  // SuperAdmin functions
  getAllAdmins,
  createAdmin,
  deleteAdmin,
  getAllUsers,
  getSystemStats,
  rejectUser,
};
