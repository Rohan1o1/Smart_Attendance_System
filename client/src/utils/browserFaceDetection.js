/**
 * Browser-based Face Detection
 * Uses the browser's native MediaPipe Face Detection API when available
 * Falls back to basic image analysis when not available
 */

class BrowserFaceDetection {
  constructor() {
    this.isInitialized = false;
    this.faceDetector = null;
    this.supportsNativeFaceDetection = false;
  }

  async initialize() {
    if (this.isInitialized) return true;
    
    console.log('🔄 Initializing browser face detection...');
    
    try {
      // Check if the browser supports native face detection
      if ('FaceDetector' in window) {
        console.log('✅ Native face detection available');
        this.faceDetector = new window.FaceDetector({
          maxDetectedFaces: 5,
          fastMode: true
        });
        this.supportsNativeFaceDetection = true;
        console.log('✅ Native face detector initialized');
      } else {
        console.log('⚠️ Native face detection not available, using fallback');
        this.supportsNativeFaceDetection = false;
      }
      
      this.isInitialized = true;
      console.log('✅ Browser face detection initialized successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Browser face detection initialization failed:', error);
      this.supportsNativeFaceDetection = false;
      this.isInitialized = true;
      return true;
    }
  }

  async detectFaces(videoElement) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.supportsNativeFaceDetection && this.faceDetector) {
      try {
        const faces = await this.faceDetector.detect(videoElement);
        return faces.map(face => ({
          x: face.boundingBox.x,
          y: face.boundingBox.y,
          width: face.boundingBox.width,
          height: face.boundingBox.height,
          confidence: 0.9, // Native detection is usually high confidence
          quality: {
            lighting: 'good',
            positioning: 'detected',
            clarity: 'native detection'
          }
        }));
      } catch (error) {
        console.error('Native face detection failed:', error);
        return this.fallbackDetection(videoElement);
      }
    } else {
      return this.fallbackDetection(videoElement);
    }
  }

  async fallbackDetection(videoElement) {
    // Use canvas-based analysis as fallback
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    ctx.drawImage(videoElement, 0, 0);
    
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const face = await this.analyzeImageForFace(imageData, canvas.width, canvas.height);
      return face ? [face] : [];
    } catch (error) {
      console.error('Fallback detection failed:', error);
      return [];
    }
  }

  async analyzeImageForFace(imageData, width, height) {
    const data = imageData.data;
    const skinRegions = [];
    const blockSize = 16;

    // Detect skin tone regions
    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        let skinPixelCount = 0;
        let totalPixels = 0;

        for (let dy = 0; dy < blockSize; dy += 4) {
          for (let dx = 0; dx < blockSize; dx += 4) {
            const index = ((y + dy) * width + (x + dx)) * 4;
            if (index < data.length - 2) {
              const r = data[index];
              const g = data[index + 1];
              const b = data[index + 2];

              if (this.isSkinTone(r, g, b)) {
                skinPixelCount++;
              }
              totalPixels++;
            }
          }
        }

        // If significant skin tone detected in this block
        if (totalPixels > 0 && (skinPixelCount / totalPixels) > 0.3) {
          skinRegions.push({
            x: x,
            y: y,
            width: blockSize,
            height: blockSize,
            density: skinPixelCount / totalPixels
          });
        }
      }
    }

    if (skinRegions.length < 3) return null;

    // Group nearby regions
    const clusters = this.clusterRegions(skinRegions);
    if (clusters.length === 0) return null;

    // Use the largest cluster as the face
    const mainCluster = clusters[0];
    const bounds = this.calculateClusterBounds(mainCluster);

    // Expand to reasonable face size
    const centerX = bounds.centerX;
    const centerY = bounds.centerY;
    const faceWidth = Math.max(100, bounds.width * 1.5);
    const faceHeight = Math.max(120, bounds.height * 1.8);

    const face = {
      x: Math.max(0, centerX - faceWidth / 2),
      y: Math.max(0, centerY - faceHeight / 2),
      width: Math.min(faceWidth, width - (centerX - faceWidth / 2)),
      height: Math.min(faceHeight, height - (centerY - faceHeight / 2)),
      confidence: Math.min(0.85, 0.5 + (mainCluster.length / 15)),
      quality: this.assessQuality(mainCluster, bounds, width, height)
    };

    return face;
  }

  isSkinTone(r, g, b) {
    // Enhanced skin detection for multiple ethnicities
    if (r < 60 || g < 40 || b < 20) return false;
    if (r > 250 && g > 250 && b > 250) return false;

    // Multiple skin tone patterns
    const pattern1 = r > 95 && g > 40 && b > 20 && Math.max(r, g, b) - Math.min(r, g, b) > 15 && Math.abs(r - g) > 15 && r > g && r > b;
    const pattern2 = r > 80 && g > 60 && b > 40 && r >= g && g >= b;
    const pattern3 = r > 100 && g > 80 && b > 60 && r > g && g > b && Math.abs(r - g) < 50;
    const pattern4 = r > 60 && g > 40 && b > 30 && r >= g && g >= b && r < 130;

    return pattern1 || pattern2 || pattern3 || pattern4;
  }

  clusterRegions(regions) {
    const clusters = [];
    const used = new Set();

    for (let i = 0; i < regions.length; i++) {
      if (used.has(i)) continue;

      const cluster = [regions[i]];
      used.add(i);

      for (let j = i + 1; j < regions.length; j++) {
        if (used.has(j)) continue;

        const distance = Math.sqrt(
          Math.pow(regions[i].x - regions[j].x, 2) + 
          Math.pow(regions[i].y - regions[j].y, 2)
        );

        if (distance < 40) {
          cluster.push(regions[j]);
          used.add(j);
        }
      }

      if (cluster.length >= 2) {
        clusters.push(cluster);
      }
    }

    return clusters.sort((a, b) => b.length - a.length);
  }

  calculateClusterBounds(cluster) {
    const minX = Math.min(...cluster.map(r => r.x));
    const maxX = Math.max(...cluster.map(r => r.x + r.width));
    const minY = Math.min(...cluster.map(r => r.y));
    const maxY = Math.max(...cluster.map(r => r.y + r.height));

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };
  }

  assessQuality(cluster, bounds, imageWidth, imageHeight) {
    const faceArea = bounds.width * bounds.height;
    const imageArea = imageWidth * imageHeight;
    const sizeRatio = faceArea / imageArea;

    // Assess based on cluster density and size
    let lighting = cluster.length > 4 ? 'good' : 'moderate';
    let positioning = 'detected';
    let clarity = sizeRatio > 0.05 ? 'clear' : 'moderate';

    // Check if face is reasonably centered
    const centerX = imageWidth / 2;
    const centerY = imageHeight / 2;
    const distanceFromCenter = Math.sqrt(
      Math.pow(bounds.centerX - centerX, 2) + 
      Math.pow(bounds.centerY - centerY, 2)
    );

    if (distanceFromCenter < Math.min(imageWidth, imageHeight) * 0.3) {
      positioning = 'well centered';
    }

    return { lighting, positioning, clarity };
  }

  isReady() {
    return this.isInitialized;
  }
}

// Export singleton instance
export const browserFaceDetection = new BrowserFaceDetection();

// Export simple detection function
export const detectFaceInBrowser = async (videoElement) => {
  try {
    const faces = await browserFaceDetection.detectFaces(videoElement);
    return faces.length > 0 ? faces[0] : null;
  } catch (error) {
    console.error('Browser face detection failed:', error);
    return null;
  }
};
