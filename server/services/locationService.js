const config = require('../config');

/**
 * Location Service
 * Handles GPS validation, distance calculations, and geofencing
 */
class LocationService {
  constructor() {
    this.earthRadiusKm = 6371; // Earth's radius in kilometers
    this.earthRadiusM = 6371000; // Earth's radius in meters
  }

  /**
   * Calculate Haversine distance between two points
   * @param {Number} lat1 - Latitude of first point
   * @param {Number} lon1 - Longitude of first point
   * @param {Number} lat2 - Latitude of second point
   * @param {Number} lon2 - Longitude of second point
   * @param {String} unit - Return unit ('km' or 'm'), default 'm'
   * @returns {Number} - Distance in specified unit
   */
  calculateHaversineDistance(lat1, lon1, lat2, lon2, unit = 'm') {
    try {
      // Validate input coordinates
      this.validateCoordinates(lat1, lon1);
      this.validateCoordinates(lat2, lon2);

      // Convert degrees to radians
      const lat1Rad = this.degreesToRadians(lat1);
      const lat2Rad = this.degreesToRadians(lat2);
      const deltaLatRad = this.degreesToRadians(lat2 - lat1);
      const deltaLonRad = this.degreesToRadians(lon2 - lon1);

      // Haversine formula
      const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
                Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      // Calculate distance
      const radius = unit === 'km' ? this.earthRadiusKm : this.earthRadiusM;
      const distance = radius * c;

      return Math.round(distance * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Haversine distance calculation error:', error.message);
      throw new Error('Failed to calculate distance between coordinates');
    }
  }

  /**
   * Validate geographic coordinates
   * @param {Number} latitude - Latitude value
   * @param {Number} longitude - Longitude value
   * @throws {Error} - If coordinates are invalid
   */
  validateCoordinates(latitude, longitude) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Coordinates must be numbers');
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Coordinates cannot be NaN');
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }
  }

  /**
   * Convert degrees to radians
   * @param {Number} degrees - Angle in degrees
   * @returns {Number} - Angle in radians
   */
  degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convert radians to degrees
   * @param {Number} radians - Angle in radians
   * @returns {Number} - Angle in degrees
   */
  radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
  }

  /**
   * Check if a point is within a circular geofence
   * @param {Object} point - Point to check {latitude, longitude}
   * @param {Object} center - Center of geofence {latitude, longitude}
   * @param {Number} radiusMeters - Radius of geofence in meters
   * @returns {Object} - Validation result
   */
  isWithinGeofence(point, center, radiusMeters) {
    try {
      const distance = this.calculateHaversineDistance(
        point.latitude,
        point.longitude,
        center.latitude,
        center.longitude
      );

      const isWithin = distance <= radiusMeters;

      return {
        isWithin,
        distance: Math.round(distance * 100) / 100,
        radius: radiusMeters,
        center,
        point,
        distanceExceededBy: isWithin ? 0 : Math.round((distance - radiusMeters) * 100) / 100
      };
    } catch (error) {
      console.error('Geofence validation error:', error.message);
      throw new Error('Failed to validate geofence');
    }
  }

  /**
   * Validate if student location is within college geofence
   * @param {Object} studentLocation - Student's location {latitude, longitude}
   * @returns {Object} - College geofence validation result
   */
  validateCollegeGeofence(studentLocation) {
    try {
      const collegeLocation = {
        latitude: config.geolocation.college.latitude,
        longitude: config.geolocation.college.longitude
      };

      const radius = config.geolocation.college.radius;

      const result = this.isWithinGeofence(studentLocation, collegeLocation, radius);

      return {
        ...result,
        type: 'college_geofence',
        passed: result.isWithin,
        message: result.isWithin 
          ? 'Student is within college premises'
          : `Student is ${result.distanceExceededBy}m outside college premises`
      };
    } catch (error) {
      console.error('College geofence validation error:', error.message);
      throw new Error('Failed to validate college geofence');
    }
  }

  /**
   * Validate if student location is within teacher's location radius
   * @param {Object} studentLocation - Student's location {latitude, longitude}
   * @param {Object} teacherLocation - Teacher's location {latitude, longitude}
   * @returns {Object} - Teacher proximity validation result
   */
  validateTeacherProximity(studentLocation, teacherLocation) {
    try {
      const radius = config.geolocation.teacher.radius;

      const result = this.isWithinGeofence(studentLocation, teacherLocation, radius);

      return {
        ...result,
        type: 'teacher_proximity',
        passed: result.isWithin,
        message: result.isWithin 
          ? 'Student is within teacher proximity'
          : `Student is ${result.distanceExceededBy}m away from teacher location`
      };
    } catch (error) {
      console.error('Teacher proximity validation error:', error.message);
      throw new Error('Failed to validate teacher proximity');
    }
  }

  /**
   * Comprehensive location validation
   * @param {Object} studentLocation - Student's location
   * @param {Object} teacherLocation - Teacher's location
   * @param {Object} options - Validation options
   * @returns {Object} - Complete validation result
   */
  validateStudentLocation(studentLocation, teacherLocation, options = {}) {
    try {
      const {
        requireCollegeGeofence = true,
        requireTeacherProximity = true,
        customCollegeRadius = null,
        customTeacherRadius = null
      } = options;

      const results = {
        timestamp: new Date().toISOString(),
        studentLocation,
        teacherLocation,
        validations: {}
      };

      // Validate college geofence
      if (requireCollegeGeofence) {
        if (customCollegeRadius) {
          const collegeLocation = {
            latitude: config.geolocation.college.latitude,
            longitude: config.geolocation.college.longitude
          };
          results.validations.collegeGeofence = this.isWithinGeofence(
            studentLocation, 
            collegeLocation, 
            customCollegeRadius
          );
        } else {
          results.validations.collegeGeofence = this.validateCollegeGeofence(studentLocation);
        }
      }

      // Validate teacher proximity
      if (requireTeacherProximity && teacherLocation) {
        if (customTeacherRadius) {
          results.validations.teacherProximity = this.isWithinGeofence(
            studentLocation, 
            teacherLocation, 
            customTeacherRadius
          );
        } else {
          results.validations.teacherProximity = this.validateTeacherProximity(
            studentLocation, 
            teacherLocation
          );
        }
      }

      // Calculate overall validation result
      const validationsPassed = Object.values(results.validations)
        .filter(validation => validation.passed !== undefined)
        .every(validation => validation.passed);

      results.overallResult = {
        passed: validationsPassed,
        passedCount: Object.values(results.validations)
          .filter(validation => validation.passed === true).length,
        totalChecks: Object.keys(results.validations).length
      };

      return results;
    } catch (error) {
      console.error('Student location validation error:', error.message);
      throw new Error('Failed to validate student location');
    }
  }

  /**
   * Check for potential GPS spoofing indicators
   * @param {Object} location - Location data to check
   * @param {Object} deviceInfo - Device information
   * @param {Object} previousLocation - Previous location (if available)
   * @returns {Object} - GPS spoofing analysis result
   */
  detectGPSSpoofing(location, deviceInfo = {}, previousLocation = null) {
    try {
      const spoofingIndicators = [];
      let riskScore = 0;

      // Check for impossible speed
      if (previousLocation && previousLocation.timestamp) {
        const timeDiff = (new Date(location.timestamp) - new Date(previousLocation.timestamp)) / 1000; // seconds
        const distance = this.calculateHaversineDistance(
          previousLocation.latitude,
          previousLocation.longitude,
          location.latitude,
          location.longitude
        );
        
        const speedMps = distance / timeDiff; // meters per second
        const speedKmh = speedMps * 3.6; // km/hour

        // Flag if speed exceeds reasonable limits (e.g., 200 km/h)
        if (speedKmh > 200) {
          spoofingIndicators.push({
            type: 'impossible_speed',
            description: `Calculated speed of ${speedKmh.toFixed(2)} km/h is unrealistic`,
            severity: 'high',
            value: speedKmh
          });
          riskScore += 40;
        }
      }

      // Check for suspicious accuracy
      if (location.accuracy) {
        if (location.accuracy < 1) {
          spoofingIndicators.push({
            type: 'suspiciously_high_accuracy',
            description: `GPS accuracy of ${location.accuracy}m is unusually high`,
            severity: 'medium',
            value: location.accuracy
          });
          riskScore += 20;
        }

        if (location.accuracy > 1000) {
          spoofingIndicators.push({
            type: 'poor_gps_accuracy',
            description: `GPS accuracy of ${location.accuracy}m is very poor`,
            severity: 'low',
            value: location.accuracy
          });
          riskScore += 10;
        }
      }

      // Check for known mock location indicators in user agent
      if (deviceInfo.userAgent) {
        const mockLocationKeywords = ['mock', 'fake', 'spoof', 'test'];
        const hasMockKeyword = mockLocationKeywords.some(keyword => 
          deviceInfo.userAgent.toLowerCase().includes(keyword)
        );

        if (hasMockKeyword) {
          spoofingIndicators.push({
            type: 'mock_location_user_agent',
            description: 'User agent contains mock location keywords',
            severity: 'high',
            value: deviceInfo.userAgent
          });
          riskScore += 30;
        }
      }

      // Check for exact coordinate patterns (often indicate spoofed locations)
      const latDecimals = location.latitude.toString().split('.')[1]?.length || 0;
      const lonDecimals = location.longitude.toString().split('.')[1]?.length || 0;

      if ((latDecimals <= 3 && lonDecimals <= 3) || (latDecimals > 10 || lonDecimals > 10)) {
        spoofingIndicators.push({
          type: 'suspicious_coordinate_precision',
          description: 'Coordinate precision suggests potential spoofing',
          severity: 'medium',
          value: { latDecimals, lonDecimals }
        });
        riskScore += 15;
      }

      // Determine risk level
      let riskLevel = 'low';
      if (riskScore >= 50) riskLevel = 'critical';
      else if (riskScore >= 30) riskLevel = 'high';
      else if (riskScore >= 15) riskLevel = 'medium';

      return {
        isPotentialSpoof: riskScore >= 30,
        riskScore: Math.min(100, riskScore),
        riskLevel,
        indicators: spoofingIndicators,
        timestamp: new Date().toISOString(),
        location,
        deviceInfo
      };
    } catch (error) {
      console.error('GPS spoofing detection error:', error.message);
      return {
        isPotentialSpoof: false,
        riskScore: 0,
        riskLevel: 'unknown',
        indicators: [],
        error: error.message
      };
    }
  }

  /**
   * Calculate bearing (direction) between two points
   * @param {Number} lat1 - Start latitude
   * @param {Number} lon1 - Start longitude
   * @param {Number} lat2 - End latitude
   * @param {Number} lon2 - End longitude
   * @returns {Number} - Bearing in degrees (0-360)
   */
  calculateBearing(lat1, lon1, lat2, lon2) {
    try {
      this.validateCoordinates(lat1, lon1);
      this.validateCoordinates(lat2, lon2);

      const lat1Rad = this.degreesToRadians(lat1);
      const lat2Rad = this.degreesToRadians(lat2);
      const deltaLonRad = this.degreesToRadians(lon2 - lon1);

      const y = Math.sin(deltaLonRad) * Math.cos(lat2Rad);
      const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
                Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLonRad);

      const bearingRad = Math.atan2(y, x);
      const bearingDeg = this.radiansToDegrees(bearingRad);

      // Convert to 0-360 degrees
      return (bearingDeg + 360) % 360;
    } catch (error) {
      console.error('Bearing calculation error:', error.message);
      throw new Error('Failed to calculate bearing');
    }
  }

  /**
   * Get location accuracy category
   * @param {Number} accuracy - GPS accuracy in meters
   * @returns {Object} - Accuracy category and description
   */
  getAccuracyCategory(accuracy) {
    if (!accuracy || accuracy <= 0) {
      return {
        category: 'unknown',
        description: 'Accuracy not provided',
        quality: 'poor',
        color: 'red'
      };
    }

    if (accuracy <= 5) {
      return {
        category: 'excellent',
        description: 'Very high accuracy',
        quality: 'excellent',
        color: 'green'
      };
    }

    if (accuracy <= 10) {
      return {
        category: 'good',
        description: 'Good accuracy',
        quality: 'good',
        color: 'lightgreen'
      };
    }

    if (accuracy <= 20) {
      return {
        category: 'fair',
        description: 'Fair accuracy',
        quality: 'fair',
        color: 'yellow'
      };
    }

    if (accuracy <= 50) {
      return {
        category: 'poor',
        description: 'Poor accuracy',
        quality: 'poor',
        color: 'orange'
      };
    }

    return {
      category: 'very_poor',
      description: 'Very poor accuracy',
      quality: 'very_poor',
      color: 'red'
    };
  }

  /**
   * Create a bounding box around a point
   * @param {Number} latitude - Center latitude
   * @param {Number} longitude - Center longitude
   * @param {Number} radiusMeters - Radius in meters
   * @returns {Object} - Bounding box coordinates
   */
  createBoundingBox(latitude, longitude, radiusMeters) {
    try {
      this.validateCoordinates(latitude, longitude);

      // Earth's circumference at the equator
      const earthCircumference = 2 * Math.PI * this.earthRadiusM;
      
      // Calculate degree offsets
      const latOffset = (radiusMeters / earthCircumference) * 360;
      const lonOffset = (radiusMeters / (earthCircumference * Math.cos(this.degreesToRadians(latitude)))) * 360;

      return {
        north: latitude + latOffset,
        south: latitude - latOffset,
        east: longitude + lonOffset,
        west: longitude - lonOffset,
        center: { latitude, longitude },
        radius: radiusMeters
      };
    } catch (error) {
      console.error('Bounding box creation error:', error.message);
      throw new Error('Failed to create bounding box');
    }
  }

  /**
   * Check if a point is within a bounding box
   * @param {Object} point - Point to check {latitude, longitude}
   * @param {Object} boundingBox - Bounding box from createBoundingBox
   * @returns {Boolean} - True if point is within bounding box
   */
  isWithinBoundingBox(point, boundingBox) {
    try {
      this.validateCoordinates(point.latitude, point.longitude);

      return point.latitude >= boundingBox.south &&
             point.latitude <= boundingBox.north &&
             point.longitude >= boundingBox.west &&
             point.longitude <= boundingBox.east;
    } catch (error) {
      console.error('Bounding box check error:', error.message);
      return false;
    }
  }
}

// Export singleton instance
const locationService = new LocationService();

module.exports = locationService;
