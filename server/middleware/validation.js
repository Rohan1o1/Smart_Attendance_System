const Joi = require('joi');
const config = require('../config');

/**
 * Validation Middleware
 * Provides request validation using Joi schemas
 */

/**
 * Generic validation middleware
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Request property to validate ('body', 'query', 'params')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false, // Return all errors
      allowUnknown: false, // Don't allow unknown fields
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ')
        .replace(/"/g, ''); // Remove quotes from error messages

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessage
      });
    }

    next();
  };
};

/**
 * Common validation schemas
 */

// User registration schema
const userRegistrationSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'First name should contain only letters',
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters'
    }),

  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Last name should contain only letters',
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters'
    }),

  email: Joi.string()
    .email()
    .lowercase()
    .max(100)
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email cannot exceed 100 characters'
    }),

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),

  phoneNumber: Joi.string()
    .pattern(config.validation.phoneNumberRegex)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),

  role: Joi.string()
    .valid('student', 'teacher', 'admin')
    .required(),

  department: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .when('role', {
      is: Joi.string().valid('student', 'teacher'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

  semester: Joi.number()
    .integer()
    .min(1)
    .max(8)
    .when('role', {
      is: 'student',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

  studentId: Joi.string()
    .trim()
    .when('role', {
      is: 'student',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

  employeeId: Joi.string()
    .trim()
    .when('role', {
      is: 'teacher',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
});

// User login schema
const userLoginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),

  password: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'Password is required'
    })
});

// Face registration schema
const faceRegistrationSchema = Joi.object({
  images: Joi.array()
    .items(Joi.string().pattern(/^data:image\/(jpeg|jpg|png);base64,/))
    .min(3)
    .max(5)
    .required()
    .messages({
      'array.min': 'At least 3 face images are required',
      'array.max': 'Maximum 5 face images allowed',
      'string.pattern.base': 'Images must be in base64 data URL format'
    })
});

// Class creation schema
const classCreationSchema = Joi.object({
  subject: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required(),

  subjectCode: Joi.string()
    .trim()
    .uppercase()
    .max(10)
    .pattern(/^[A-Z0-9]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Subject code should contain only uppercase letters and numbers'
    }),

  department: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required(),

  semester: Joi.number()
    .integer()
    .min(1)
    .max(8)
    .required(),

  academicYear: Joi.string()
    .pattern(/^\d{4}-\d{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'Academic year must be in format YYYY-YYYY (e.g., 2023-2024)'
    }),

  schedule: Joi.object({
    dayOfWeek: Joi.string()
      .valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')
      .required(),

    startTime: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required()
      .messages({
        'string.pattern.base': 'Start time must be in HH:MM format'
      }),

    endTime: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required()
      .messages({
        'string.pattern.base': 'End time must be in HH:MM format'
      })
  }).required(),

  geofenceRadius: Joi.number()
    .min(5)
    .max(100)
    .default(20),

  classroom: Joi.string()
    .trim()
    .max(50)
    .optional(),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
});

// Class start session schema
const startSessionSchema = Joi.object({
  location: Joi.object({
    latitude: Joi.number()
      .min(-90)
      .max(90)
      .required(),

    longitude: Joi.number()
      .min(-180)
      .max(180)
      .required(),

    accuracy: Joi.number()
      .min(0)
      .optional(),

    address: Joi.string()
      .trim()
      .max(200)
      .optional()
  }).required()
});

// Attendance submission schema
const attendanceSubmissionSchema = Joi.object({
  classId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid class ID format'
    }),

  location: Joi.object({
    latitude: Joi.number()
      .min(-90)
      .max(90)
      .required(),

    longitude: Joi.number()
      .min(-180)
      .max(180)
      .required(),

    accuracy: Joi.number()
      .min(0)
      .optional(),

    address: Joi.string()
      .trim()
      .max(200)
      .optional()
  }).required(),

  faceImage: Joi.string()
    .base64()
    .required()
    .messages({
      'string.base64': 'Face image must be a valid base64 encoded image'
    }),

  deviceInfo: Joi.object({
    userAgent: Joi.string().max(500).optional(),
    platform: Joi.string().max(50).optional(),
    browser: Joi.string().max(50).optional()
  }).optional()
});

// Query parameter schemas
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10),

  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'name', 'email', 'timestamp')
    .default('createdAt'),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
});

const dateRangeSchema = Joi.object({
  startDate: Joi.date()
    .iso()
    .optional(),

  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.min': 'End date must be after start date'
    })
});

// ID parameter schema
const idParameterSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid ID format'
    })
});

// Student enrollment schema
const studentEnrollmentSchema = Joi.object({
  studentIds: Joi.array()
    .items(
      Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one student ID is required',
      'string.pattern.base': 'Invalid student ID format'
    })
});

// Profile update schema
const profileUpdateSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .optional(),

  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .optional(),

  phoneNumber: Joi.string()
    .pattern(config.validation.phoneNumberRegex)
    .optional(),

  department: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional(),

  semester: Joi.number()
    .integer()
    .min(1)
    .max(8)
    .optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Password change schema
const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string()
    .required(),

  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match'
    })
});

module.exports = {
  validate,
  userRegistrationSchema,
  userLoginSchema,
  faceRegistrationSchema,
  classCreationSchema,
  startSessionSchema,
  attendanceSubmissionSchema,
  paginationSchema,
  dateRangeSchema,
  idParameterSchema,
  studentEnrollmentSchema,
  profileUpdateSchema,
  passwordChangeSchema
};
