# SurakshaScore

A personal digital hygiene scanner that turns a person's device, account and
privacy posture into one explainable security score.

## What it does

SurakshaScore runs a staged scan across six categories — device, apps, network,
configuration, account and habits — and produces:

- **An overall score (0–100) with a visible breakdown.** Scoring is a pure
  function of collected signals: the same signals always produce the same score.
  Every category bar links to the findings that moved it.
- **Findings with provenance.** Every displayed data point carries a provenance
  tier — `VERIFIED`, `PERMISSION_BASED`, `SELF_REPORTED` or `UNAVAILABLE`. When
  a platform API cannot supply a value the field renders as unavailable rather
  than silently defaulting to a passing value.
- **Per-finding explanations.** Finding copy is generated deterministically from
  the detected condition using typed templates — no runtime LLM calls.
- **A local credential vault** and three security tools: a password leak
  checker, a breach monitor and a link scanner.

The password leak checker is a real integration: it queries the Have I Been
Pwned range API using k-anonymity (SHA-1, 5-character prefix), so neither the
password nor its full hash leaves the device.

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · Capacitor (Android) · Vitest ·
Lucide icons.

## How to run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (defaults to <http://localhost:5173>).

Other scripts:

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run build       # typecheck, then production build to dist/
npm run preview     # serve the production build
```

To run on Android via Capacitor (requires Android Studio and the Android SDK):

```bash
npm run build
npx cap sync android
npx cap open android
```

## Status

Working prototype. The scoring engine, rule engine, finding registry,
completeness engine, capability matrix and the three tools are implemented and
covered by 107 passing unit tests (`npm test`). Typecheck is clean.

Important limits, stated plainly:

- **The browser scan is driven by a mock signal provider.** In the web build,
  signals come from selectable demo profiles (for example `student`), not from
  your actual machine — a browser cannot read OS patch level, screen-lock state
  or installed-app permissions. The scan pipeline, scoring and findings running
  over those signals are real; the inputs are simulated.
- **The Android collectors are written against Capacitor but are not fully
  wired to native plugins.** `deviceCollector` exposes a `nativeBridge`
  interface for patch date, screen lock, developer options, unknown sources and
  storage encryption; a native implementation still has to be supplied for
  those to return verified device data.
- The local vault is seeded with clearly-labelled fictional demo entries. It is
  a UI demonstration, not a hardened password manager.
- No backend, no accounts, no sync. Everything is in-memory in the client and
  is lost on reload.

## Repository contents

- `src/core/` — platform-agnostic engine: models, rules, scoring, explanations
- `src/lib/` — collectors, scan pipeline, tools, mock signal provider
- `src/screens/`, `src/components/` — the React UI
- `tests/` — Vitest suites
- `android/` — Capacitor Android project
- `PSS-Engineering-Spec.md` — the engineering specification the app was built to
- `SurakshaScore-*.html`, `docs/` — design, wireframe and technical reports
  produced during development
