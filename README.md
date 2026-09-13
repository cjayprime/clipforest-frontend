# ClipRover — web

The user-facing half of an AI short-form video clipping platform: upload a long video, watch it process, review the ranked shortlist of moments, and turn any of them into a captioned 1080×1920 clip.

Next.js 16 (**Pages Router**) + Tailwind v4 + React Query, with SSE for live progress and polling as a fallback. The backend lives in its own repository and deploys independently.

## How it talks to the API

The browser only ever calls this app's own origin. `next.config.ts` rewrites `/api/*` to the backend, so auth cookies stay first-party and there is no CORS to configure. One variable points at the backend:

```
API_INTERNAL_URL=http://localhost:4000     # as seen from this server, not the browser
```

**Next.js resolves rewrites at build time**, so in a container build this is a `--build-arg`, not a runtime environment variable (see the Dockerfile). On Vercel, set it as a project environment variable — it is read during the build.

## Quick start

The backend must be running first (see its README: Docker infra + worker, then the API on :4000).

```bash
cp .env.example .env
npm install
npm run dev            # http://localhost:3000
```

Open http://localhost:3000 and register — **no account is seeded**, and registration signs you straight in with no verification step.

Password reset emails are sent by the backend. With no Brevo key configured there, the reset link is printed to the API's log instead of being delivered.

## Layout

| Path | What it is |
| --- | --- |
| `src/pages/` | Routes: public landing page (`/`), authenticated dashboard (`/dashboard`), new video, processing/results, clip editor, clips, settings, sign-in, register, forgot password, reset password. |
| `src/components/` | Screens (new video, video/results, clip editor) and shared UI (shell, timeline, source player, candidate and video cards, upload progress). |
| `src/lib/` | API client, React Query hooks, SSE event stream, direct-to-storage uploader, timecode and formatting helpers. |
| `src/proxy.ts` | Optimistic auth redirect (real authorization happens in the API). |
| `src/styles/` | Tailwind v4 `@theme` tokens. |
| `tests/browser/` | Playwright end-to-end, plus the tour and probe scripts — see [tests/README.md](tests/README.md). |
| `docs/deployment.md` | Deploying this app on its own. |
| `__ui_design__/` | The original Obsidian Kinetic design reference. |

## Tests

Playwright is expected to be installed **globally** (`npm i -g @playwright/test && npx playwright install chromium`) — this repo does not depend on it.

```bash
npx playwright test                      # end-to-end through the real UI and pipeline
node tests/browser/tour.mjs --out shots  # screenshot every screen, report console/network errors
npm run lint
npm run build
```

Both drive the real backend, so the full stack has to be up. See [tests/README.md](tests/README.md).

## Build

```bash
npm run build && npm start                                            # standalone Node server
docker build --build-arg API_INTERNAL_URL=https://api.example.com .   # container
```

See [docs/deployment.md](docs/deployment.md).
