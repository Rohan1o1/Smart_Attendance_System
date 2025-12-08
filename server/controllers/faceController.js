const User = require('../models/User');
const { faceRecognitionService } = require('../services');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config');

/**
 * Face Registration Controller
 * Handles face image upload and embedding registration
 */

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: config.faceRecognition.maxFaceImages
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, and PNG images are allowed'), false);
    }
  }
});

/**
 * Register face images for a user
 * POST /face/register
 */
const registerFaceImages = async (req, res) => {
  try {
    console.log('🔍 Face registration request received');
    const userId = req.user._id;
    const { images } = req.body; // Array of base64 images

    console.log(`📸 Processing ${images?.length || 0} images for user ${userId}`);

    if (!images || !Array.isArray(images) || images.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'At least 3 face images are required'
      });
    }

    if (images.length > config.faceRecognition.maxFaceImages) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${config.faceRecognition.maxFaceImages} face images allowed`
      });
    }

    // Check if face recognition service is ready
    if (!faceRecognitionService.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Face recognition service is not ready. Please try again later.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already has face images registered
    if (user.faceEmbeddings && user.faceEmbeddings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Face images already registered. Use update endpoint to modify.'
      });
    }

    const processedImages = [];
    const faceEmbeddings = [];
    let validationErrors = [];

    // Process each image
    for (let i = 0; i < images.length; i++) {
      try {
        const base64Image = images[i];

        // Validate image quality
        const qualityValidation = await faceRecognitionService.validateImageQuality(base64Image);
        if (!qualityValidation.isValid) {
          validationErrors.push({
            imageIndex: i + 1,
            reason: qualityValidation.reason,
            suggestions: qualityValidation.suggestions
          });
          continue;
        }

        // Extract face embedding
        const embeddingResult = await faceRecognitionService.extractFaceEmbedding(base64Image);
        
        // Check if face embedding extraction was successful
        if (!embeddingResult.success) {
          validationErrors.push({
            imageIndex: i + 1,
            reason: embeddingResult.error || 'Face embedding extraction failed',
            suggestions: ['Try again with a different image', 'Ensure good lighting and clear face visibility']
          });
          continue;
        }

        // Save image file
        const fileName = `face_${userId}_${Date.now()}_${i + 1}.jpg`;
        const filePath = path.join(config.upload.uploadPath, 'faces', fileName);
        
        // Ensure directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        // Convert base64 to buffer and save
        const imageData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
        const imageBuffer = Buffer.from(imageData, 'base64');
        await fs.writeFile(filePath, imageBuffer);

        // Store embedding data
        faceEmbeddings.push({
          embedding: embeddingResult.embedding,
          imageUrl: `/uploads/faces/${fileName}`,
          confidence: embeddingResult.confidence,
          livenessCheck: embeddingResult.livenessCheck,
          createdAt: new Date()
        });

        processedImages.push({
          index: i + 1,
          confidence: embeddingResult.confidence,
          livenessScore: embeddingResult.livenessCheck.score,
          fileName
        });

      } catch (error) {
        console.error(`Error processing image ${i + 1}:`, error);
        validationErrors.push({
          imageIndex: i + 1,
          reason: error.message,
          suggestions: ['Try again with a different image', 'Ensure good lighting and clear face visibility']
        });
      }
    }

    // Check if we have enough valid images
    if (faceEmbeddings.length < 3) {
      // Clean up any saved files
      for (const processed of processedImages) {
        try {
          const filePath = path.join(config.upload.uploadPath, 'faces', processed.fileName);
          await fs.unlink(filePath);
        } catch (error) {
          console.error('Error cleaning up file:', error);
        }
      }

      return res.status(400).json({
        success: false,
        message: 'Not enough valid face images. At least 3 valid images required.',
        validationErrors,
        processedCount: faceEmbeddings.length
      });
    }

    // Save embeddings to user
    user.faceEmbeddings = faceEmbeddings;
    await user.save();

    // Get updated user data without sensitive information
    const updatedUser = await User.findById(userId).select('-password -refreshToken');

    res.status(201).json({
      success: true,
      message: 'Face images registered successfully',
      data: {
        user: updatedUser, // Include updated user data
        processedImages: processedImages.length,
        totalSubmitted: images.length,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
        faceData: processedImages
      }
    });

  } catch (error) {
    console.error('Face registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register face images',
      error: config.server.env === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update face images for a user
 * PUT /face/update
 */
const updateFaceImages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { images, replaceAll = false } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least 1 face image is required'
      });
    }

    if (!faceRecognitionService.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Face recognition service is not ready. Please try again later.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If replacing all, clean up old images
    if (replaceAll && user.faceEmbeddings) {
      for (const embedding of user.faceEmbeddings) {
        try {
          const fileName = path.basename(embedding.imageUrl);
          const filePath = path.join(config.upload.uploadPath, 'faces', fileName);
          await fs.unlink(filePath);
        } catch (error) {
          console.error('Error deleting old face image:', error);
        }
      }
      user.faceEmbeddings = [];
    }

    const processedImages = [];
    const newEmbeddings = [];
    let validationErrors = [];

    // Process new images
    for (let i = 0; i < images.length; i++) {
      try {
        const base64Image = images[i];

        // Validate image quality
        const qualityValidation = await faceRecognitionService.validateImageQuality(base64Image);
        if (!qualityValidation.isValid) {
          validationErrors.push({
            imageIndex: i + 1,
            reason: qualityValidation.reason,
            suggestions: qualityValidation.suggestions
          });
          continue;
        }

        // Extract face embedding
        const embeddingResult = await faceRecognitionService.extractFaceEmbedding(base64Image);

        // Save image file
        const fileName = `face_${userId}_${Date.now()}_${i + 1}.jpg`;
        const filePath = path.join(config.upload.uploadPath, 'faces', fileName);
        
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        const imageData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
        const imageBuffer = Buffer.from(imageData, 'base64');
        await fs.writeFile(filePath, imageBuffer);

        newEmbeddings.push({
          embedding: embeddingResult.embedding,
          imageUrl: `/uploads/faces/${fileName}`,
          confidence: embeddingResult.confidence,
          livenessCheck: embeddingResult.livenessCheck,
          createdAt: new Date()
        });

        processedImages.push({
          index: i + 1,
          confidence: embeddingResult.confidence,
          livenessScore: embeddingResult.livenessCheck.score,
          fileName
        });

      } catch (error) {
        console.error(`Error processing image ${i + 1}:`, error);
        validationErrors.push({
          imageIndex: i + 1,
          reason: error.message,
          suggestions: ['Try again with a different image']
        });
      }
    }

    // Add new embeddings to existing ones (if not replacing all)
    if (!replaceAll) {
      user.faceEmbeddings.push(...newEmbeddings);
    } else {
      user.faceEmbeddings = newEmbeddings;
    }

    // Ensure we don't exceed max images limit
    if (user.faceEmbeddings.length > config.faceRecognition.maxFaceImages) {
      user.faceEmbeddings = user.faceEmbeddings.slice(-config.faceRecognition.maxFaceImages);
    }

    // Ensure minimum required images
    if (user.faceEmbeddings.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'At least 3 valid face images are required in total',
        currentCount: user.faceEmbeddings.length,
        validationErrors
      });
    }

    await user.save();

    // Get updated user data without sensitive information
    const updatedUser = await User.findById(userId).select('-password -refreshToken');

    res.json({
      success: true,
      message: 'Face images updated successfully',
      data: {
        user: updatedUser, // Include updated user data
        totalFaceImages: user.faceEmbeddings.length,
        newImagesAdded: processedImages.length,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined
      }
    });

  } catch (error) {
    console.error('Face update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update face images',
      error: config.server.env === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verify face image against registered faces
 * POST /face/verify
 */
const verifyFace = async (req, res) => {
  try {
    const userId = req.user._id;
    const { faceImage } = req.body;

    if (!faceImage) {
      return res.status(400).json({
        success: false,
        message: 'Face image is required'
      });
    }

    if (!faceRecognitionService.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Face recognition service is not ready. Please try again later.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.faceEmbeddings || user.faceEmbeddings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No face images registered. Please register your face first.'
      });
    }

    // Validate image quality
    const qualityValidation = await faceRecognitionService.validateImageQuality(faceImage);
    if (!qualityValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Image quality validation failed',
        reason: qualityValidation.reason,
        suggestions: qualityValidation.suggestions
      });
    }

    // Extract face embedding from submitted image
    const embeddingResult = await faceRecognitionService.extractFaceEmbedding(faceImage);

    // Compare with registered faces
    const matchResult = faceRecognitionService.findBestMatch(
      embeddingResult.embedding,
      user.faceEmbeddings
    );

    // Create verification result
    const verificationResult = {
      isVerified: matchResult.isMatch,
      confidence: matchResult.bestSimilarity,
      distance: matchResult.bestDistance,
      threshold: matchResult.threshold,
      livenessCheck: embeddingResult.livenessCheck,
      timestamp: new Date().toISOString()
    };

    // Log verification attempt for security
    console.log(`Face verification attempt for user ${userId}: ${verificationResult.isVerified ? 'SUCCESS' : 'FAILED'}, confidence: ${verificationResult.confidence}`);

    res.json({
      success: true,
      message: verificationResult.isVerified ? 'Face verified successfully' : 'Face verification failed',
      data: verificationResult
    });

  } catch (error) {
    console.error('Face verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify face',
      error: config.server.env === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get user's face registration status
 * GET /face/status
 */
const getFaceStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('faceEmbeddings');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const faceCount = user.faceEmbeddings ? user.faceEmbeddings.length : 0;
    const isRegistered = faceCount >= 3;
    const hasFaceData = faceCount > 0; // Include hasFaceData for frontend compatibility

    res.json({
      success: true,
      data: {
        isRegistered,
        hasFaceData, // Add this field for frontend compatibility
        faceCount,
        maxFaces: config.faceRecognition.maxFaceImages,
        registrationDate: faceCount > 0 ? user.faceEmbeddings[0].createdAt : null,
        lastUpdate: faceCount > 0 ? Math.max(...user.faceEmbeddings.map(f => new Date(f.createdAt))) : null
      }
    });

  } catch (error) {
    console.error('Get face status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get face status'
    });
  }
};

/**
 * Delete face images (for testing or re-registration)
 * DELETE /face/delete
 */
const deleteFaceImages = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete image files
    if (user.faceEmbeddings) {
      for (const embedding of user.faceEmbeddings) {
        try {
          const fileName = path.basename(embedding.imageUrl);
          const filePath = path.join(config.upload.uploadPath, 'faces', fileName);
          await fs.unlink(filePath);
        } catch (error) {
          console.error('Error deleting face image file:', error);
        }
      }
    }

    // Clear embeddings from database
    user.faceEmbeddings = [];
    await user.save();

    res.json({
      success: true,
      message: 'All face images deleted successfully'
    });

  } catch (error) {
    console.error('Delete face images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete face images'
    });
  }
};

module.exports = {
  registerFaceImages,
  updateFaceImages,
  verifyFace,
  getFaceStatus,
  deleteFaceImages,
  upload // Export multer instance for route use
};
