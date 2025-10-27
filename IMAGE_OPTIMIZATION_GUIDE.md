# Image Optimization Guide

## 🎯 Current Issues from Lighthouse

### Performance Impact: **Est. 184 KiB savings**

Your Lighthouse audit identified these image optimization opportunities:

1. **Cloudinary Profile Image** - 116 KiB savings
   - Current: 1080x1080 displayed as 36x36
   - Issue: Image is 30x larger than needed

2. **Map Marker Icons** - 20 KiB savings
   - Current: 512x512 displayed as 38x38
   - Issue: Icons are 13x larger than needed

3. **OpenStreetMap Tiles** - 48 KiB savings
   - Issue: PNG format instead of WebP

---

## ✅ Quick Fixes

### 1. Optimize Cloudinary Images

Cloudinary supports automatic optimization via URL parameters. Update your image URLs:

**Before:**
```javascript
<img 
  src="https://res.cloudinary.com/.../admin_profiles/vm7rkqz4ukko1eec2yoq.jpg"
  className="h-10 w-10 rounded-full"
/>
```

**After:**
```javascript
<img 
  src="https://res.cloudinary.com/.../admin_profiles/vm7rkqz4ukko1eec2yoq.jpg?w=80&h=80&c=fill&f_auto&q_auto"
  className="h-10 w-10 rounded-full"
  loading="lazy"
  width="40"
  height="40"
/>
```

**Cloudinary URL Parameters:**
- `w=80` - Width 80px (2x for retina)
- `h=80` - Height 80px
- `c=fill` - Crop to fill
- `f_auto` - Auto format (WebP for supported browsers)
- `q_auto` - Auto quality

**Savings:** 116 KiB → ~5 KiB (95% reduction!)

---

### 2. Use Next.js Image Component

Replace all `<img>` tags with Next.js `<Image>` for automatic optimization:

**Before:**
```javascript
<img src="/Logoo.png" alt="Logo" className="h-15 w-32 ml-6" />
```

**After:**
```javascript
import Image from 'next/image';

<Image 
  src="/Logoo.png" 
  alt="Logo" 
  width={128}
  height={60}
  className="ml-6"
  priority // For above-the-fold images
/>
```

**Benefits:**
- Automatic WebP/AVIF conversion
- Lazy loading by default
- Responsive images
- Prevents layout shift

---

### 3. Optimize Map Marker Icons

Download and optimize your marker icons:

```bash
# Install image optimization tool
npm install -g sharp-cli

# Optimize marker icons
sharp -i public/marker-icon.png -o public/marker-icon-optimized.png resize 76 76 webp
```

Or use online tools:
- https://squoosh.app/
- https://tinypng.com/

**Target size:** 38x38 displayed, 76x76 actual (for retina)

---

## 🔧 Implementation Steps

### Step 1: Update next.config.js

Add Cloudinary domain for Next.js Image optimization:

```javascript
// next.config.js
module.exports = {
  images: {
    domains: [
      'res.cloudinary.com',
      'images.icon-icons.com',
      'via.placeholder.com',
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Enable compression
  compress: true,
};
```

### Step 2: Create Image Optimization Utility

```javascript
// utils/imageOptimizer.js

/**
 * Optimize Cloudinary image URL
 * @param {string} url - Original Cloudinary URL
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @returns {string} Optimized URL
 */
export function optimizeCloudinaryUrl(url, width, height) {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // Insert transformations before /upload/
  const transformations = `w_${width * 2},h_${height * 2},c_fill,f_auto,q_auto`;
  return url.replace('/upload/', `/upload/${transformations}/`);
}

/**
 * Get responsive image srcset
 * @param {string} url - Original image URL
 * @param {number} baseWidth - Base width
 * @returns {string} srcset string
 */
export function getResponsiveSrcSet(url, baseWidth) {
  if (!url || !url.includes('cloudinary.com')) return '';
  
  const sizes = [1, 2, 3]; // 1x, 2x, 3x
  return sizes
    .map(scale => {
      const w = baseWidth * scale;
      const optimized = optimizeCloudinaryUrl(url, w, w);
      return `${optimized} ${scale}x`;
    })
    .join(', ');
}
```

### Step 3: Update AdminProfile.js

```javascript
import Image from 'next/image';
import { optimizeCloudinaryUrl } from '../utils/imageOptimizer';

// In your component:
{admin.profile_image_url && (
  <Image
    src={optimizeCloudinaryUrl(admin.profile_image_url, 96, 96)}
    alt="Profile"
    width={96}
    height={96}
    className="mt-2 rounded object-cover"
    loading="lazy"
  />
)}
```

### Step 4: Update Navbar Profile Image

```javascript
// In Admin/index.js
import Image from 'next/image';

<Image 
  onClick={handleProfileClick}
  src="/profile.jpg"
  alt="Profile"
  width={40}
  height={40}
  className={`rounded-full cursor-pointer border-2 ${
    IsProfileDropdown ? 'border-blue-600' : 'border-transparent'
  }`}
/>
```

### Step 5: Update Logo Images

```javascript
// Replace all logo instances
import Image from 'next/image';

<Image 
  src="/Logoo.png" 
  alt="Municipality Logo" 
  width={80}
  height={80}
  className="object-contain"
  priority // Logo is above-the-fold
/>
```

---

## 📊 Expected Results

| Image Type | Before | After | Savings |
|------------|--------|-------|---------|
| Profile Images | 116 KiB | ~5 KiB | **95%** |
| Map Markers | 20 KiB | ~2 KiB | **90%** |
| Logos | 15 KiB | ~3 KiB | **80%** |
| **Total** | **151 KiB** | **10 KiB** | **93%** |

---

## 🚀 Advanced Optimizations

### 1. Preload LCP Image

If your profile image is the LCP element:

```javascript
// In pages/_document.js
<Head>
  <link
    rel="preload"
    as="image"
    href="/Logoo.png"
    imageSrcSet="/Logoo.png 1x, /Logoo@2x.png 2x"
  />
</Head>
```

### 2. Use Modern Image Formats

Convert static images to WebP/AVIF:

```bash
# Convert PNG to WebP
npx @squoosh/cli --webp auto public/Logoo.png

# Convert to AVIF (even smaller)
npx @squoosh/cli --avif auto public/Logoo.png
```

### 3. Lazy Load Below-the-Fold Images

```javascript
<Image
  src="/image.jpg"
  alt="Description"
  width={300}
  height={200}
  loading="lazy" // Default for Next.js Image
/>
```

### 4. Add Blur Placeholder

```javascript
<Image
  src="/image.jpg"
  alt="Description"
  width={300}
  height={200}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Generate with sharp
/>
```

---

## 🔍 Testing Your Optimizations

### 1. Check Image Sizes

```javascript
// Add to browser console
document.querySelectorAll('img').forEach(img => {
  console.log({
    src: img.src,
    naturalSize: `${img.naturalWidth}x${img.naturalHeight}`,
    displaySize: `${img.width}x${img.height}`,
    ratio: (img.naturalWidth / img.width).toFixed(2)
  });
});
```

**Ideal ratio:** 2.0 (for retina displays)

### 2. Run Lighthouse Again

After implementing:
```bash
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Run "Performance" audit
4. Check "Improve image delivery" section
```

**Target:** 0 KiB savings remaining

### 3. Check Network Tab

```bash
1. Open DevTools → Network tab
2. Filter by "Img"
3. Reload page
4. Verify:
   - Images are WebP/AVIF format
   - Sizes match display dimensions (2x for retina)
   - Total image size < 100 KiB
```

---

## 📝 Checklist

- [ ] Add Cloudinary domain to next.config.js
- [ ] Create imageOptimizer.js utility
- [ ] Replace `<img>` with Next.js `<Image>` component
- [ ] Optimize Cloudinary URLs with transformations
- [ ] Add width/height to all images
- [ ] Add loading="lazy" to below-fold images
- [ ] Add priority to above-fold images
- [ ] Convert static images to WebP
- [ ] Test with Lighthouse
- [ ] Verify image sizes in Network tab

---

## 🆘 Troubleshooting

### Images not loading with Next.js Image:

**Error:** "Invalid src prop"

**Fix:** Add domain to next.config.js:
```javascript
images: {
  domains: ['res.cloudinary.com'],
}
```

### Images still large:

**Check:** Cloudinary transformations in URL
```javascript
// Should include: w_80,h_80,c_fill,f_auto,q_auto
console.log(imageUrl);
```

### Layout shift after optimization:

**Fix:** Always specify width and height:
```javascript
<Image src="..." width={40} height={40} />
```

---

## 📚 Resources

- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Cloudinary Transformations](https://cloudinary.com/documentation/image_transformations)
- [WebP Format Guide](https://developers.google.com/speed/webp)
- [Lighthouse Image Optimization](https://web.dev/uses-optimized-images/)

---

**Expected Performance Improvement:**
- **LCP:** 1.8s → ~1.2s (33% faster)
- **Performance Score:** 82 → 90+ (10% improvement)
- **Total Page Size:** -184 KiB (22% reduction)
