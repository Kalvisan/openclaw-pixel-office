/** PM2 config for Pixel Office runtime – orchestration + office view */
module.exports = {
  apps: [
    {
      name: "pixel-office-runtime",
      script: "pnpm",
      args: "dev:runtime",
      cwd: __dirname,
      interpreter: "none",
      autorestart: true,
      watch: false,
    },
  ],
};
