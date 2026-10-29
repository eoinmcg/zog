/**
 * storage.js
 * A simple ES6 module for safely interacting with window.localStorage.
 */

// A function to check if localStorage is available and accessible
// This is necessary because just checking window.localStorage can throw an error
const isLocalStorageAvailable = () => {
  const testKey = '__storage_test__';
  try {
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

const storageAvailable = isLocalStorageAvailable();


/**
 * Safely sets a value in localStorage.
 * Automatically converts objects/arrays to JSON strings.
 * @param {string} key - The key for the storage item.
 * @param {any} value - The value to store.
 */
export const setItem = (key, value) => {
  if (!storageAvailable) {
    console.warn(`[Storage] localStorage not available. Cannot set item: ${key}`);
    return;
  }
  try {
    const serializedValue = JSON.stringify(value);
    window.localStorage.setItem(key, serializedValue);
  } catch (e) {
    console.error(`[Storage] Error setting item '${key}':`, e);
  }
};


/**
 * Safely retrieves a value from localStorage.
 * Automatically converts the JSON string back to an object/array.
 * @param {string} key - The key for the storage item.
 * @param {any} defaultValue - The value to return if the item is not found or retrieval fails.
 * @returns {any} The retrieved value or the defaultValue.
 */
export const getItem = (key, defaultValue = null) => {
  if (!storageAvailable) {
    console.warn(`[Storage] localStorage not available. Returning default value for: ${key}`);
    return defaultValue;
  }

  try {
    const serializedValue = window.localStorage.getItem(key);

    // If the key doesn't exist, return the default value
    if (serializedValue === null) {
      return defaultValue;
    }

    // Otherwise, parse the JSON string and return the value
    return JSON.parse(serializedValue);

  } catch (e) {
    // Catch errors from getItem (e.g., security) or JSON.parse (corrupted data)
    console.error(`[Storage] Error getting or parsing item '${key}'. Returning default value.`, e);
    return defaultValue;
  }
};


/**
 * Safely removes a key from localStorage.
 * @param {string} key - The key to remove.
 */
export const removeItem = (key) => {
  if (!storageAvailable) {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch (e) {
    console.error(`[Storage] Error removing item '${key}':`, e);
  }
};

