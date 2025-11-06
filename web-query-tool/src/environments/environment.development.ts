/**
 * Development Environment Configuration
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api/v1',
  apiUrlHttps: 'https://localhost:5001/api/v1',
  signalRUrl: 'https://localhost:5001/hubs',
  enableDebugLogs: true,
  queryTimeout: 300, // 5 minutes
  maxQueryRows: 10000,
  version: '1.0.0-dev'
};
