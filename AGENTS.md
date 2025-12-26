# Operation MorpheusReforge

## Repo stance (facts)

- Workspace: Yarn classic + Lerna (`package.json` at repo root). No package-manager migrations without explicit approval.
- Active focus: `packages/morpheus` (engine source lives under `packages/morpheus/client/js/morpheus`) and `packages/www` (Next app).
- Legacy / do-not-touch unless requested: `packages/auth`, `packages/bot*`, `packages/cordova`, `packages/electron`, `packages/functions`, `packages/ssl`, `packages/style`, infra under `ops/`.

## Commands we still rely on

- Install deps: `yarn install`
- Root turbo entry points (Node 24 expected): `yarn lint`, `yarn typecheck`, `yarn build`, `yarn dev`
- Legacy bootstrap (runs lerna): `yarn bootstrap`
- Engine legacy dev loop: `yarn workspace @soapbubble/morpheus-client start:dev`
- Web dev loop: `yarn workspace morpheus-next dev`
- Type check everything (legacy fan-out): `yarn workspaces run type-check`
- Tests (legacy): `yarn workspace @soapbubble/morpheus-client test`

Any new scripts must target Node 24, be watch-friendly, and avoid Babel/Webpack unless grandfathered.

## Guardrails for agents

- Write strict TypeScript + modern ESM. No `as any`, no unsafe casts, no `key in obj` hacks to dodge the type system.
- React code must stay functional, explicit hooks imports (`import { useState } from 'react';`), and never rely on the global `React`.
- No new build surfaces using Webpack, Gulp, or Babel transpilation. Prefer esbuild-class toolchains (tsup, Vite, Turbo tasks).
- Question assumptions. If a change impacts bundlers, package managers, infra, or auth, stop and ask first.
- Everything under version control predates LLM workflows—document every new convention as you create it.

## Ops contract

- Keep edits scoped to the active packages unless work is explicitly staged for legacy folders.
- Document new workflows immediately here or in package-level README files.
- Never delete or reformat historical assets under `packages/morpheus/client/playthrough`, `packages/morpheus/server`, or `packages/www/public` without direction.
- Treat Firebase configs, Dockerfiles, and deployment manifests as read-only unless an ops request says otherwise.

## Open questions to resolve as we modernize

- Confirm when we migrate from Yarn v1/Lerna to a modern runner (`turbo`, `pnpm`, etc.).
- Clarify future home for auth once Next.js is upgraded (NextAuth vs custom).
- Define how much of the old Morpheus server logic survives once the engine becomes a pure TS library.
