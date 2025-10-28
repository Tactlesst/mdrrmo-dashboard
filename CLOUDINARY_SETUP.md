# Cloudinary Setup Guide ✅

## 📋 Issue Fixed

**Error**: `Module not found: Can't resolve '@/lib/cloudinary'`  
**Solution**: Created `lib/cloudinary.js` configuration file

---

## ✅ What Was Created

### **File**: `lib/cloudinary.js`

```javascript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
export { v2 as cloudinary };
```

---

## 🔧 Required Environment Variables

Add these to your `.env.local` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

---

## 📝 How to Get Cloudinary Credentials

### **Step 1: Sign Up / Login**
1. Go to https://cloudinary.com
2. Sign up for a free account or login
3. You'll be redirected to your Dashboard

### **Step 2: Get Your Credentials**
1. On the Dashboard, you'll see:
   - **Cloud Name**: `your_cloud_name`
   - **API Key**: `123456789012345`
   - **API Secret**: `abcdefghijklmnopqrstuvwxyz` (click "Reveal" to see it)

### **Step 3: Create `.env.local` File**
1. In your project root, create a file named `.env.local`
2. Add the credentials:

```env
# Database (already exists)
DATABASE_URL=your_database_url

# JWT Secret (already exists)
JWT_SECRET=your_jwt_secret

# Cloudinary Configuration (ADD THESE)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz

# Node Environment
NODE_ENV=development
```

---

## 🎯 What Uses Cloudinary

These files upload images to Cloudinary:

1. **`pages/api/upload-image.js`** - Admin profile images
2. **`pages/api/upload-signature.js`** - PCR form signatures
3. **`pages/api/proxy-image.js`** - Image proxy for displaying

---

## ✅ Verification

After adding the environment variables:

1. **Restart your dev server**:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Test image upload**:
   - Go to Admin Profile
   - Try uploading a profile image
   - Should work without errors

---

## 🔒 Security Notes

- ✅ **Never commit `.env.local`** to Git (already in `.gitignore`)
- ✅ **Keep API Secret private** - Don't share it
- ✅ **Use different credentials** for production vs development
- ✅ **Rotate secrets** if they're exposed

---

## 📦 Package Already Installed

The `cloudinary` package is already in your `package.json`:
```json
"cloudinary": "^2.7.0"
```

No need to install anything! ✅

---

## 🆓 Cloudinary Free Tier

**Free Plan Includes:**
- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month
- Perfect for development and small projects

---

## ✅ Summary

**What was fixed:**
- ✅ Created `lib/cloudinary.js` configuration file
- ✅ Package already installed (`cloudinary@2.7.0`)
- ✅ Documentation created

**What you need to do:**
1. Get Cloudinary credentials from https://cloudinary.com
2. Create `.env.local` file in project root
3. Add the three environment variables
4. Restart dev server

**After setup:**
- ✅ Image uploads will work
- ✅ Profile pictures can be uploaded
- ✅ PCR signatures can be saved

---

**Last Updated**: October 28, 2025  
**Status**: ✅ Module created, awaiting credentials
