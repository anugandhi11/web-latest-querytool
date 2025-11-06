/**
 * Production Environment Configuration
 */
export const environment = {
  production: true,
  apiUrl: 'https://api.verisk.com/api/v1',
  apiUrlHttps: 'https://api.verisk.com/api/v1',
  signalRUrl: 'https://api.verisk.com/hubs',
  enableDebugLogs: false,
  queryTimeout: 300, // 5 minutes
  maxQueryRows: 10000,
  version: '1.0.0'
};
