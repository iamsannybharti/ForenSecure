module.exports = {
  apps: [
    {
      name: 'forensecure-api',
      script: './dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      max_memory_restart: '500M',
      restart_delay: 3000,
      listen_timeout: 8000,
      kill_timeout: 3000
    }
  ]
};
