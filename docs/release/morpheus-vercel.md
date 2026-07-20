# Morpheus Vercel Release Runbook

This runbook deploys the Next.js player without committing converted `GameDB`
media or the authored `morpheus.map.json`. It deliberately uses stable public
media paths; it is not a content-release or pointer system.

## Project configuration

Configure the `morpheus-web-www` Vercel project as follows:

| Setting | Value |
| --- | --- |
| Root Directory | `packages/www` |
| Framework | Next.js |
| Node.js | `24.x` |
| Install command | Vercel default Yarn Classic install |
| Build command | `yarn vercel-build` |
| Build output | `.next` |

`packages/www/vercel.json` and its `vercel-build` script are the
source-controlled part of this configuration. That package script returns to
the workspace root to run the engine first: it restores or validates the map
and produces the engine UI images before Next evaluates
`packages/www/next.config.js`.

## Blob stores and variables

Create two stores with named owners recorded in the project settings:

| Purpose | Access | Vercel variable | Value |
| --- | --- | --- | --- |
| Game media | public | `NEXT_PUBLIC_MORPHEUS_GAMEDB_ORIGIN` | Parent URL of `GameDB`, for example `https://<store>.public.blob.vercel-storage.com` |
| Authored map | private | `MORPHEUS_MAP_BLOB_URL` | Full private Blob URL for `morpheus.map.json` |
| Authored map read token | build-only | `BLOB_READ_WRITE_TOKEN` | Token scoped to the private map store |

Set the public origin for Preview and Production. Set the private-map URL and
token only for trusted Preview and Production deployment refs. Never use a
`NEXT_PUBLIC_` variable for the map URL/token, and do not inject the token into
untrusted forks or arbitrary external PR deployments. Rotate it when Vercel
project access or the deployment trust boundary changes.

The map is protected as a repository/build input, not as client secrecy: the
browser bundle currently imports scene data.

## Import the media once

From a workstation with the converted source available, run the importer with
the public-store token in the process environment. It resolves the local
`packages/www/public/GameDB` symlink target, skips nested symlinks, preserves
each `GameDB/...` pathname, and reports inventory and ETags.

```bash
BLOB_READ_WRITE_TOKEN=... yarn workspace morpheus-next upload:gamedb -- --report gamedb-import.json
```

Keep the importer report and the source corpus location with the release
record. Upload only rights-cleared converted archive media.

For a stable-path correction, retain the prior source, record the current
ETag, and run the importer in its explicit update mode. Before it writes,
update mode checks every current Blob ETag against that prior report and
refuses the entire update if any object changed. Record the new ETags and wait
through the documented finite cache lifetime before declaring success. This is
a stale-state guard, not an atomic conditional overwrite: Vercel Blob documents
overwrite support, but does not document a conditional PUT by ETag. If another
operator can write concurrently, pause the update or serialize ownership.

## Preview and promotion gate

1. Create the private map object and variables before triggering the build.
   A missing map must fail early with a credential-safe error.
2. Confirm the preview build invokes the engine preflight before Next and
   contains no local `GameDB` corpus.
3. Request a PNG, MP4/WebM, and AAC/MP3/Ogg object directly from the public
   Blob origin. Verify content types, `ETag`, `Accept-Ranges`, and a video
   byte-range `206` response.
4. In a desktop preview, replay title intro, deep-link to a known scene, rotate
   the panorama, play a panorama animation/audio/controlled movie, and perform
   an authored scene transition. Inspect console/network: no Blob CORS failure
   and no `/api/game-control` WebSocket attempt.
5. On a physical Safari/iOS device, replay a panorama animation from the direct
   public origin. A failure blocks promotion; do not add a proxy as a shortcut.
6. Only then promote and repeat the network/media checks on the final hostname.
   Create/resume a save and switch slots there; IndexedDB saves do not migrate
   between localhost, preview, and production origins.

Record preview/production URL, commit, Blob origin, map object identifier/ETag,
test scene IDs, browser/device, timestamp, and evidence capture.

## Rollback and operations

- **Code:** roll back by promoting the prior good Vercel deployment.
- **Media:** re-upload the retained known-good object at the same pathname,
  record old/new ETags, wait for the cache policy, and replay the affected
  scene in a fresh browser context.
- **Map:** restore the prior private object, update its URL only through the
  trusted build variable, and deploy a new build; map changes require normal
  code-review/change control.
- **Spend:** set a paid-plan spend notification before public launch. Review
  Blob transfer, edge requests, and cache-miss/origin usage after launch.
