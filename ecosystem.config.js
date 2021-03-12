module.exports = [
  {
    script: 'dist/src/http/server.js',
    name: 'email-api-backend',
  },
  {
    script: 'dist/src/processQueue.js',
    name: 'email-api-queue',
  },
];
