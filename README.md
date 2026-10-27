# AAVIL ERP frontend

React and TypeScript frontend for the AAVIL ERP application.

## Local development

Requires Node.js 22.12 or newer and pnpm through Corepack.

```sh
corepack pnpm install
corepack pnpm dev
```

The frontend sends API requests to the same-origin '/api' path. For Netlify, configure a rewrite from '/api/*' to your Render API service at 'https://YOUR-RENDER-SERVICE.onrender.com/api/:splat' with status 200. This keeps session cookies on the frontend origin.

For a Netlify site, use the repository root as the base directory, 'corepack pnpm install --frozen-lockfile && corepack pnpm build' as the build command, and 'dist' as the publish directory.

Never add database URLs, API keys, or other server secrets to frontend environment variables.
