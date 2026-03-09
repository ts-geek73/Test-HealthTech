 
module.exports = {
  apps: [
    {
      name: "healthtech-backend",
      script: "dist/index.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: "cloudflared",
      script: "cloudflared",
      interpreter: "none",
      args: "tunnel --url http://localhost:5000",
      autorestart: true,
      watch: false,
    },
  ],
};