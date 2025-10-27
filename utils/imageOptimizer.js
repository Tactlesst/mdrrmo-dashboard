/**
 * Image Optimization Utilities
 * Optimizes Cloudinary URLs for better performance
 */

/**
 * Optimize Cloudinary image URL with transformations
 * @param {string} url - Original Cloudinary URL
 * @param {number} width - Target width in pixels
 * @param {number} height - Target height in pixels
 * @returns {string} Optimized URL with transformations
 */
export function optimizeCloudinaryUrl(url, width, height) {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // Use 2x size for retina displays
  const retinaWidth = width * 2;
  const retinaHeight = height * 2;
  
  // Build transformation string
  const transformations = `w_${retinaWidth},h_${retinaHeight},c_fill,f_auto,q_auto`;
  
  // Insert transformations before /upload/
  return url.replace('/upload/', `/upload/${transformations}/`);
}

/**
 * Get responsive image srcset for Cloudinary images
 * @param {string} url - Original Cloudinary URL
 * @param {number} baseWidth - Base width in pixels
 * @returns {string} srcset string for responsive images
 */
export function getResponsiveSrcSet(url, baseWidth) {
  if (!url || !url.includes('cloudinary.com')) return '';
  
  const sizes = [1, 2, 3]; // 1x, 2x, 3x for different pixel densities
  return sizes
    .map(scale => {
      const w = baseWidth * scale;
      const optimized = optimizeCloudinaryUrl(url, w, w);
      return `${optimized} ${scale}x`;
    })
    .join(', ');
}

/**
 * Check if URL is from Cloudinary
 * @param {string} url - Image URL
 * @returns {boolean} True if Cloudinary URL
 */
export function isCloudinaryUrl(url) {
  return url && typeof url === 'string' && url.includes('cloudinary.com');
}
