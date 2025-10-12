// Environment configuration
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  devServerUrl: import.meta.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:9999',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
}
