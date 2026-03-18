/**
 * API base URL for the backend.
 * Set EXPO_PUBLIC_API_URL in .env to your Mac's IP (e.g. http://192.168.1.5:8000)
 * so your phone can connect. Get your IP: run "ipconfig getifaddr en0" in terminal.
 */
export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'http://172.20.10.2:8000';
