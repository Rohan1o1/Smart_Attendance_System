/**
 * Location Service Hook
 * Handles GPS location detection and verification
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

// Location options
const LOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000 // 1 minute cache
};

// Default allowed radius in meters
const DEFAULT_ALLOWED_RADIUS = 100;

/**
 * Custom hook for location services
 */
export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const watchId = useRef(null);

  /**
   * Get current location
   */
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by this browser';
        setError(error);
        reject(new Error(error));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed
          };

          setLocation(locationData);
          setAccuracy(position.coords.accuracy);
          setLoading(false);
          
          resolve(locationData);
        },
        (error) => {
          let errorMessage = 'Unable to retrieve location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = `Location error: ${error.message}`;
              break;
          }

          setError(errorMessage);
          setLoading(false);
          reject(new Error(errorMessage));
        },
        LOCATION_OPTIONS
      );
    });
  }, []);

  /**
   * Start watching location changes
   */
  const startWatching = useCallback((callback) => {
    if (!navigator.geolocation) {
      const error = 'Geolocation is not supported by this browser';
      setError(error);
      return null;
    }

    setLoading(true);
    setError(null);

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed
        };

        setLocation(locationData);
        setAccuracy(position.coords.accuracy);
        setLoading(false);
        
        if (callback) {
          callback(locationData);
        }
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = `Location error: ${error.message}`;
            break;
        }

        setError(errorMessage);
        setLoading(false);
      },
      LOCATION_OPTIONS
    );

    return watchId.current;
  }, []);

  /**
   * Stop watching location changes
   */
  const stopWatching = useCallback(() => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  /**
   * Verify if current location is within allowed area
   */
  const verifyLocation = useCallback(async (targetLocation, allowedRadius = DEFAULT_ALLOWED_RADIUS) => {
    try {
      const currentLocation = await getCurrentLocation();
      
      if (!targetLocation || !targetLocation.latitude || !targetLocation.longitude) {
        throw new Error('Target location not provided');
      }

      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        targetLocation.latitude,
        targetLocation.longitude
      );

      const isWithinRange = distance <= allowedRadius;
      
      return {
        success: isWithinRange,
        distance: Math.round(distance),
        allowedRadius,
        accuracy: currentLocation.accuracy,
        currentLocation,
        targetLocation,
        message: isWithinRange 
          ? `Location verified - ${Math.round(distance)}m from target`
          : `Location too far - ${Math.round(distance)}m from target (max: ${allowedRadius}m)`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Location verification failed: ${error.message}`
      };
    }
  }, [getCurrentLocation, calculateDistance]);

  return {
    location,
    loading,
    error,
    accuracy,
    getCurrentLocation,
    startWatching,
    stopWatching,
    verifyLocation,
    calculateDistance
  };
};

/**
 * Location Verification Component
 */
import React from 'react';
import { MapPin, Loader, CheckCircle, AlertCircle, Navigation } from 'lucide-react';

export const LocationVerification = ({
  targetLocation,
  allowedRadius = DEFAULT_ALLOWED_RADIUS,
  onVerification,
  showMap = false,
  className = ''
}) => {
  const {
    location,
    loading,
    error,
    accuracy,
    verifyLocation
  } = useLocation();

  const [verificationResult, setVerificationResult] = React.useState(null);
  const [verifying, setVerifying] = React.useState(false);

  const handleVerifyLocation = async () => {
    setVerifying(true);
    setVerificationResult(null);

    try {
      const result = await verifyLocation(targetLocation, allowedRadius);
      setVerificationResult(result);
      
      if (onVerification) {
        onVerification(result);
      }

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const errorResult = {
        success: false,
        error: error.message,
        message: `Verification failed: ${error.message}`
      };
      setVerificationResult(errorResult);
      toast.error(errorResult.message);
    } finally {
      setVerifying(false);
    }
  };

  const getStatusColor = () => {
    if (verificationResult) {
      return verificationResult.success ? 'text-success-600' : 'text-error-600';
    }
    return 'text-secondary-600';
  };

  const getStatusIcon = () => {
    if (verifying || loading) {
      return <Loader className="w-5 h-5 animate-spin" />;
    }
    if (verificationResult) {
      return verificationResult.success 
        ? <CheckCircle className="w-5 h-5 text-success-600" />
        : <AlertCircle className="w-5 h-5 text-error-600" />;
    }
    return <MapPin className="w-5 h-5" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Status */}
      <div className="card p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h4 className="font-medium text-secondary-900">Location Verification</h4>
              <p className={`text-sm ${getStatusColor()}`}>
                {verificationResult 
                  ? verificationResult.message
                  : error 
                  ? error
                  : loading
                  ? 'Getting location...'
                  : 'Ready to verify location'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleVerifyLocation}
            disabled={verifying || loading || !targetLocation}
            className={`btn btn-sm ${verificationResult?.success ? 'btn-success' : 'btn-primary'}`}
          >
            <Navigation className="w-4 h-4 mr-2" />
            {verifying ? 'Verifying...' : verificationResult?.success ? 'Verified' : 'Verify Location'}
          </button>
        </div>

        {/* Location Details */}
        {(location || verificationResult) && (
          <div className="mt-4 pt-4 border-t space-y-2">
            {location && (
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600">Current Location:</span>
                <span className="text-secondary-900 font-medium">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </span>
              </div>
            )}
            
            {accuracy && (
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600">GPS Accuracy:</span>
                <span className="text-secondary-900 font-medium">
                  ±{Math.round(accuracy)}m
                </span>
              </div>
            )}
            
            {verificationResult && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600">Distance to Target:</span>
                  <span className="text-secondary-900 font-medium">
                    {verificationResult.distance}m
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600">Allowed Radius:</span>
                  <span className="text-secondary-900 font-medium">
                    {verificationResult.allowedRadius}m
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Map placeholder */}
      {showMap && targetLocation && (
        <div className="card p-4">
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <MapPin className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
            <p className="text-secondary-600">Map integration would go here</p>
            <p className="text-xs text-secondary-500 mt-2">
              Target: {targetLocation.latitude}, {targetLocation.longitude}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationVerification;
