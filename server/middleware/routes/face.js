const express = require('express');
const { faceController } = require('../controllers');
const { 
  authenticate, 
  authorize,
  validate,
  faceRegistrationSchema,
  faceUploadRateLimiter
} = require('../middleware');

const router = express.Router();

/**
 * Face Recognition Routes
 */

// @route   POST /face/register
// @desc    Register face images for user
// @access  Private
router.post('/register', 
  authenticate,
  faceUploadRateLimiter,
  validate(faceRegistrationSchema),
  faceController.registerFaceImages
);

// @route   PUT /face/update
// @desc    Update face images for user
// @access  Private
router.put('/update', 
  authenticate,
  faceUploadRateLimiter,
  faceController.updateFaceImages
);

// @route   POST /face/verify
// @desc    Verify face against registered faces
// @access  Private
router.post('/verify', 
  authenticate,
  faceUploadRateLimiter,
  faceController.verifyFace
);

// @route   GET /face/status
// @desc    Get face registration status
// @access  Private
router.get('/status', 
  authenticate,
  faceController.getFaceStatus
);

// @route   DELETE /face/delete
// @desc    Delete all face images (for re-registration)
// @access  Private
router.delete('/delete', 
  authenticate,
  faceController.deleteFaceImages
);

module.exports = router;
