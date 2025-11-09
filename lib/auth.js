import jwt from 'jsonwebtoken';

/**
 * Decode JWT token from auth cookie (client-side)
 * Note: This only decodes the token, it doesn't verify the signature
 * Use this on the client side to extract user information
 */
export function decodeAuthToken(token) {
  try {
    if (!token) return null;
    
    // Decode without verification (client-side)
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Get auth token from cookies (client-side)
 */
export function getAuthTokenFromCookies() {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth='));
  
  if (!authCookie) return null;
  
  const token = authCookie.split('=')[1];
  return token;
}

/**
 * Get decoded user data from auth cookie
 */
export function getAuthUser() {
  const token = getAuthTokenFromCookies();
  if (!token) return null;
  
  return decodeAuthToken(token);
}
