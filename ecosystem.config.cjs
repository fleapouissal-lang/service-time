/** PM2 — production web (Next.js). */
module.exports = {
  apps: [
    {
      name: "service-time",
      cwd: __dirname,
      script: "npm",
      args: "run start:web",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
