/**
 * Safe storage wrapper that handles:
 * - Server-side rendering (no window/localStorage)
 * - Privacy-focused browsers that may block localStorage
 * - Graceful fallback when storage is unavailable
 */

// In-memory fallback when localStorage is unavailable
let memoryStorage = {};

/**
 * Check if we're in a browser environment
 */
const isBrowser = () => typeof window !== 'undefined';

/**
 * Check if localStorage is available and accessible
 */
const isLocalStorageAvailable = () => {
  if (!isBrowser()) return false;
  
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Cache the availability check
let storageAvailable = null;

const checkStorage = () => {
  if (storageAvailable === null) {
    storageAvailable = isLocalStorageAvailable();
  }
  return storageAvailable;
};

/**
 * Safe storage object with localStorage-like interface
 */
export const storage = {
  /**
   * Get an item from storage
   * @param {string} key - The key to retrieve
   * @returns {string|null} - The stored value or null
   */
  get: (key) => {
    if (!isBrowser()) return null;
    
    if (checkStorage()) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn('localStorage.getItem failed:', e.message);
        return memoryStorage[key] || null;
      }
    }
    
    return memoryStorage[key] || null;
  },

  /**
   * Set an item in storage
   * @param {string} key - The key to store
   * @param {string} value - The value to store
   */
  set: (key, value) => {
    if (!isBrowser()) return;
    
    // Always store in memory as backup
    memoryStorage[key] = value;
    
    if (checkStorage()) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn('localStorage.setItem failed:', e.message);
      }
    }
  },

  /**
   * Remove an item from storage
   * @param {string} key - The key to remove
   */
  remove: (key) => {
    if (!isBrowser()) return;
    
    delete memoryStorage[key];
    
    if (checkStorage()) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('localStorage.removeItem failed:', e.message);
      }
    }
  },

  /**
   * Clear all items from storage
   */
  clear: () => {
    if (!isBrowser()) return;
    
    memoryStorage = {};
    
    if (checkStorage()) {
      try {
        localStorage.clear();
      } catch (e) {
        console.warn('localStorage.clear failed:', e.message);
      }
    }
  },

  /**
   * Check if storage is available
   * @returns {boolean}
   */
  isAvailable: () => checkStorage(),
};

// Token-specific helpers for cleaner auth code
export const tokenStorage = {
  getAccessToken: () => storage.get('access_token'),
  setAccessToken: (token) => storage.set('access_token', token),
  getRefreshToken: () => storage.get('refresh_token'),
  setRefreshToken: (token) => storage.set('refresh_token', token),
  clearTokens: () => {
    storage.remove('access_token');
    storage.remove('refresh_token');
  },
};

export default storage;
