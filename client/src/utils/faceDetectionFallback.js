/**
 * Fallback face detection utility
 * Used when face-api.js is not available or fails
 */

// Enhanced skin tone detection for various ethnicities
export const isSkinTone = (r, g, b) => {
  // Basic checks
  if (r < 60 || g < 40 || b < 20) return false; // Too dark
  if (r > 250 && g > 250 && b > 250) return false; // Too white/bright
  
  // Enhanced skin tone detection covering more ethnicities
  const isValidSkin = (
    // Condition 1: Standard skin tone (covers most caucasian and light skin tones)
    (r > 95 && g > 40 && b > 20 && Math.max(r, g, b) - Math.min(r, g, b) > 15 && Math.abs(r - g) > 15 && r > g && r > b) ||
    
    // Condition 2: Brown/darker skin tones
    (r > 80 && g > 60 && b > 40 && r >= g && g >= b && r - b >= 20) ||
    
    // Condition 3: Asian/medium skin tones
    (r > 100 && g > 80 && b > 60 && r > g && g > b && Math.abs(r - g) < 50) ||
    
    // Condition 4: Very dark skin tones
    (r > 60 && g > 40 && b > 30 && r >= g && g >= b && r - b >= 10 && r < 130)
  );
  
  // Additional checks for skin-like characteristics
  if (isValidSkin) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const colorVariation = max - min;
    
    // Skin typically has moderate color variation (not too flat, not too varied)
    return colorVariation > 5 && colorVariation < 100;
  }
  
  return false;
};

// Improved motion detection for face tracking
export const detectMotion = (prevFrame, currentFrame, width, height) => {
  const motionAreas = [];
  const blockSize = 20;
  const threshold = 30; // Difference threshold
  
  for (let y = 0; y < height - blockSize; y += blockSize) {
    for (let x = 0; x < width - blockSize; x += blockSize) {
      let totalDiff = 0;
      let pixelCount = 0;
      
      // Compare pixels in this block
      for (let dy = 0; dy < blockSize; dy += 2) {
        for (let dx = 0; dx < blockSize; dx += 2) {
          const index = ((y + dy) * width + (x + dx)) * 4;
          
          if (index + 3 < Math.min(prevFrame.length, currentFrame.length)) {
            const rDiff = Math.abs(prevFrame[index] - currentFrame[index]);
            const gDiff = Math.abs(prevFrame[index + 1] - currentFrame[index + 1]);
            const bDiff = Math.abs(prevFrame[index + 2] - currentFrame[index + 2]);
            
            totalDiff += (rDiff + gDiff + bDiff) / 3;
            pixelCount++;
          }
        }
      }
      
      if (pixelCount > 0) {
        const avgDiff = totalDiff / pixelCount;
        if (avgDiff > threshold) {
          motionAreas.push({
            x: x,
            y: y,
            width: blockSize,
            height: blockSize,
            motionLevel: avgDiff
          });
        }
      }
    }
  }
  
  return motionAreas;
};

// Improved face quality assessment
export const assessFaceQuality = (faceRegion, imageData, width, height) => {
  const { x, y, width: faceWidth, height: faceHeight } = faceRegion;
  
  // Sample pixels in face region for quality analysis
  let brightness = 0;
  let contrast = 0;
  let pixelCount = 0;
  
  const sampleSize = 5; // Sample every 5th pixel for performance
  
  for (let dy = 0; dy < faceHeight; dy += sampleSize) {
    for (let dx = 0; dx < faceWidth; dx += sampleSize) {
      const pixelX = Math.floor(x + dx);
      const pixelY = Math.floor(y + dy);
      
      if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
        const index = (pixelY * width + pixelX) * 4;
        
        if (index + 2 < imageData.length) {
          const r = imageData[index];
          const g = imageData[index + 1];
          const b = imageData[index + 2];
          
          // Calculate brightness (luminance)
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          brightness += lum;
          
          // For contrast, we'll calculate after averaging
          pixelCount++;
        }
      }
    }
  }
  
  if (pixelCount === 0) {
    return {
      lighting: 'poor',
      positioning: 'unknown',
      clarity: 'unclear',
      score: 0.3
    };
  }
  
  const avgBrightness = brightness / pixelCount;
  
  // Assess lighting based on brightness
  let lighting = 'poor';
  if (avgBrightness > 60 && avgBrightness < 200) {
    lighting = 'good';
  } else if (avgBrightness > 40 && avgBrightness < 220) {
    lighting = 'moderate';
  }
  
  // Assess positioning based on face size and location
  const faceArea = faceWidth * faceHeight;
  const imageArea = width * height;
  const faceSizeRatio = faceArea / imageArea;
  
  let positioning = 'adjust needed';
  if (faceSizeRatio > 0.05 && faceSizeRatio < 0.3) {
    const centerX = width / 2;
    const centerY = height / 2;
    const faceCenterX = x + faceWidth / 2;
    const faceCenterY = y + faceHeight / 2;
    
    const distanceFromCenter = Math.sqrt(
      Math.pow(faceCenterX - centerX, 2) + 
      Math.pow(faceCenterY - centerY, 2)
    );
    
    if (distanceFromCenter < Math.min(width, height) * 0.25) {
      positioning = 'good';
    } else if (distanceFromCenter < Math.min(width, height) * 0.4) {
      positioning = 'moderate';
    }
  }
  
  // Assess clarity based on face size and lighting
  let clarity = 'unclear';
  if (faceArea > 8000 && lighting !== 'poor') {
    clarity = 'clear';
  } else if (faceArea > 5000) {
    clarity = 'moderate';
  }
  
  // Calculate overall quality score
  let score = 0.3; // Base score
  if (lighting === 'good') score += 0.3;
  else if (lighting === 'moderate') score += 0.2;
  
  if (positioning === 'good') score += 0.3;
  else if (positioning === 'moderate') score += 0.15;
  
  if (clarity === 'clear') score += 0.2;
  else if (clarity === 'moderate') score += 0.1;
  
  return {
    lighting,
    positioning,
    clarity,
    brightness: avgBrightness,
    faceSize: faceArea,
    score: Math.min(score, 0.95)
  };
};
