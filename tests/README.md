# Tests

`browser/` is a Playwright suite that drives the real UI against the real backend pipeline — sign-up, upload, processing, results, render, download. Nothing is mocked, so a run takes minutes and produces an actual MP4.

Playwright is expected to be installed **globally**:

```bash
npm i -g @playwright/test && npx playwright install chromium
```

## Prerequisites

The backend repo supplies the first two, this repo the third:

```bash
cd backend/infra && docker compose --env-file ../.env up -d   # postgres, redis, minio, worker
cd backend/api   && npm run start:dev                          # API on :4000
npm run dev                                                    # web on :3000
```

With no provider keys set the backend runs fully offline (mock transcription + heuristic analysis) and still renders a real 1080×1920 clip.

Use `localhost`, not `127.0.0.1` — the browser uploads straight to storage and the storage CORS allow-list is origin-exact. Override with `CLIPFOREST_WEB_URL` if you serve the app elsewhere.

## Running

```bash
npx playwright test                    # golden-path.spec.ts
npx playwright test --headed           # watch it
```

## Looking at the UI

`browser/tour.mjs` walks every screen (desktop + mobile), screenshots each one, and reports console errors, failed requests and 4xx/5xx API responses:

```bash
node tests/browser/tour.mjs --out shots                          # full walk incl. upload + render
node tests/browser/tour.mjs --reuse you@example.com --out shots  # skip the upload, reuse an account
node tests/browser/tour.mjs --headed                             # watch it happen
```

It writes `report.json` alongside the screenshots.

`browser/probe.mjs <email> [path]` is an ad-hoc DOM probe for layout questions — it signs in at phone width and reports anything overflowing the viewport.

## Fixtures

`browser/.fixtures/sample.mp4` (gitignored) is generated, not committed. From the backend repo, which has the worker image with FFmpeg:

```bash
docker run --rm -v "<this-repo>/tests/browser/.fixtures:/out" clipforest-worker \
  ffmpeg -v error -y -f lavfi -i testsrc2=size=640x360:rate=24 -f lavfi -i sine=frequency=300 \
  -t 100 -c:v libx264 -preset veryfast -crf 38 -pix_fmt yuv420p -c:a aac -b:a 64k /out/sample.mp4
```

Any short MP4 with an audio track works. It is a synthetic pattern with no faces, so renders fall back to center crop by design.
