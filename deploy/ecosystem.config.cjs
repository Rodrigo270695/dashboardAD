module.exports = {
  apps: [
    {
      name: "dashboardad",
      cwd: "/var/www/dashboardAD",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3010",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3010",
      },
    },
  ],
};
