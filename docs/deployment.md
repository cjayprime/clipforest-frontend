# Deployment — web

This app is a stateless Next.js server. It holds no database, no queue and no credentials; everything it shows comes from the backend API, and every session cookie is set by the API and merely passed through. That makes it cheap to deploy anywhere and safe to redeploy at any time.

## The one variable

```
API_INTERNAL_URL=https://api.clips.example.com
```

Where the backend is reachable **from this server**, not from the browser. `next.config.ts` rewrites `/api/*` there, so:

- the browser only ever calls this app's own origin — no CORS,
- session cookies are first-party to this origin,
- the API host never needs to be public-facing to browsers (though it usually is, because signed storage URLs are issued by it).

**Next.js resolves rewrites at build time.** Changing `API_INTERNAL_URL` requires a rebuild, not a restart. Plan for one build artifact per environment.

## Vercel

Set `API_INTERNAL_URL` as a project environment variable (per environment) and deploy. It is read during the build, so redeploy after changing it. Nothing else is required — no `NEXT_PUBLIC_*` values exist.

## Node server

```bash
npm ci
API_INTERNAL_URL=https://api.clips.example.com npm run build
npm start                                  # PORT defaults to 3000
```

`output: 'standalone'` is enabled, so `.next/standalone` plus `.next/static` and `public/` is a complete deployable.

## Container

```bash
docker build --build-arg API_INTERNAL_URL=https://api.clips.example.com -t clipforest-web .
docker run -p 3000:3000 clipforest-web
```

Put TLS in front of it (Caddy, a load balancer, or the platform's own). Health: any 200 from `/sign-in` is enough — this app has no readiness dependencies of its own; if the API is down, pages render and show an error state.

## Storage CORS

Uploads and playback go **directly** between the browser and Cloudflare R2, bypassing both servers. The R2 bucket's CORS policy must therefore allow **this app's origin**, with `ETag` exposed for multipart uploads:

```json
[
  {
    "AllowedOrigins": ["https://clips.example.com"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

That policy lives with the bucket, which the backend repo owns — coordinate a new frontend origin with it. Locally the equivalent is `MINIO_CORS_ORIGINS` in the backend's `.env`.

## Checklist for a new environment

1. Backend deployed and `GET /api/health/ready` is green.
2. `API_INTERNAL_URL` set, build run.
3. Backend's `PUBLIC_WEB_URL` set to this app's origin (API CORS).
4. R2/MinIO CORS allow-list includes this app's origin.
5. Backend's `COOKIE_SECURE=true` if this origin is HTTPS.
