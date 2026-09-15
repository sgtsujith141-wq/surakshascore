# PSS — Personal Digital Hygiene Dashboard
## Engineering Specification & Implementation Sequence (v1.0)

Audience: a coding agent that will implement this against the existing `PSS`/`sentinel` React + TypeScript + Vite + Capacitor codebase. This document assumes the repo structure already visible in the project (`src/screens/*`, `src/components/layout/AppShell`, `src/auth/AuthContext`, Supabase backend, `@capacitor/android`).

No application code is included here. This is the contract the coding agent must build against.

---

## 0. Reference App Teardown (Sentinel) — what to keep, fix, cut

Studied all 12 screenshots. Findings:

### What's genuinely good (KEEP the underlying idea, not the visuals)
- **Signal-typed cards** (Network Health / Connected Devices / App Permissions each show a status word: SECURE / DETECTED / MONITORED) — good pattern, but currently shows placeholder zeros (`0 devices found`, `0 total permissions`) which is a credibility killer. Fix: never show a stat card in a "final" state with 0/unknown data — show an explicit "not scanned yet" or "unavailable on this OS" state instead.
- **App Inventory drill-down** with per-permission unexpected/expected classification and a numeric per-app risk score — this is the single strongest feature in the reference. Keep and harden it.
- **Finding detail pattern**: Risk level → "Why we detected this" → "Why this matters" → evidence bullets → "What you can do" → primary action + "Mark as Fixed" secondary action. This is a solid, reusable finding template. Keep the shape, rewrite the copy generation so it's not obviously templated ("We found an unexpected security risk in this app" is a generic placeholder — must be replaced with real per-finding text, see §5).
- **Password Leak Checker via k-anonymity HIBP range API** — real, legitimate, keep and actually implement correctly (SHA-1, 5-char prefix, k-anonymity, never send full hash or plaintext).
- **Local vault with master-password unlock, local encryption** — good, but must be spec'd properly (see §7 Vault).
- **Bottom tab nav**: Home / Alerts / Tools / Vault — 4 tabs is the right number for a security app. Keep this exact IA.
- **Streak/day strip at top of Home** (M T W T F S S with filled dots) — decent retention hook if it's driven by real scan history, not fake.

### What's weak / must NOT be copied
- **Typography**: the whole app uses a casual handwritten/cursive display font (looks like "Caveat"/"Kalam") for headings on a *security product*. This actively undermines trust — a security tool must feel precise, not playful. **Hard rule: no handwritten/script fonts anywhere in PSS.**
- **Fake/placeholder numeric states**: "0 devices found on your local network", "0 total permissions granted across apps" while claiming DETECTED/MONITORED status = looks broken, not secure. Every stat must either be real or explicitly marked as pending/unavailable.
- **Generic finding copy**: "We found an unexpected security risk in this app" — this is a template stub, not real analysis text. Every finding needs a finding-type-specific explanation generated from the actual detected condition (which permission, which combination, which OS fact).
- **No evidence of score math**: 89/100 is shown with no visible breakdown of how it was computed beyond three flat category bars (Device 80, Apps 80, Privacy 100) that don't obviously map to "18 security problems found." The scoring model is not explainable. This must be fixed — see §6.
- **"18 Security Problems Found" but only ~2 findings shown in the flow** — inconsistent counts erode trust instantly. Every count shown anywhere in the UI must come from one single source of truth.
- **Local Port Scanner marked "Desktop App Required"** — a mobile security app advertising a feature it structurally cannot do on-device is a red flag for a judge. Either cut it from mobile entirely or reframe as a companion-only feature that's clearly gated, not front-and-center.
- **Vault UX**: master password field lets "Unlock" stay enabled/disabled ambiguously (grey button, unclear if it's disabled-until-typed or just poorly styled) — must have explicit enabled/disabled states.
- **Card sprawl on Home**: Home screen in the screenshots stacks Score card → Overview donut → OS/category card → Why It Matters card → Human Element teaser, all full width, all competing — no single hero moment. Violates "understand posture in 3-5 seconds."

### Decision: what we keep as literal parity features (must ship) vs. what we build better
See §2 (Feature Matrix) for the full mapping.

---

## 1. Product Principles (restated as engineering constraints)

These become literal validation rules, not aspirations:

1. **Every displayed data point has a `provenance` tag**: `VERIFIED | PERMISSION_BASED | SELF_REPORTED | UNAVAILABLE`. This tag is part of the TypeScript type for every Finding, Signal, and ScoreComponent — not optional, not inferred in the UI layer.
2. **No signal is invented.** If a Capacitor plugin/OS API cannot return a value, the field is `UNAVAILABLE`, rendered with a distinct neutral visual style (dashed border / muted icon), never silently defaulted to a "good" value.
3. **Scoring is a pure function**: `computeScore(signals: Signal[]) => ScoreBreakdown`. Same input signals always produce the same score. No randomness, no LLM calls, no server-side black box for the number itself.
4. **Android/iOS capability divergence is modeled explicitly** in a capability matrix (§4), not discovered ad hoc in components. A screen renders differently per-platform based on this matrix, not per feature flag scattered through code.
5. **No chatbot, no generative "AI wrote this finding" text at runtime.** Finding copy is authored per finding-type as templates with typed slots (e.g. `{permissionList}`, `{count}`), filled deterministically. This is fast, offline-capable, reviewable, and demoable without needing network/LLM latency during a judge demo.
6. **No mock chart occupies a "real data" visual slot.** Any chart backed by <2 real data points must render an explicit empty/insufficient-data state, not a fabricated trend line.

---

## 2. Feature Matrix — Reference vs. PSS (what ships)

| # | Reference feature | Ship in PSS? | PSS treatment |
|---|---|---|---|
| 1 | Home score hero + trend | Yes | Rebuilt as single hero card, real 7-scan rolling history, explicit "insufficient history" state until ≥2 scans exist |
| 2 | Category health bars (Device/Apps/Privacy) | Yes | Renamed to match actual scan categories (§3), each bar links to its finding subset, each bar shows contributing signal count |
| 3 | "Run Security Check" primary CTA | Yes | Kept, becomes single dominant Home CTA |
| 4 | Staged scan (Device → Apps → Network → Config → Account → Habits) | Yes | Rebuilt as real sequential async pipeline with per-stage real Capacitor calls, not a fixed timer animation |
| 5 | Results screen w/ severity buckets | Yes | Rebuilt, single source-of-truth finding count everywhere |
| 6 | App Inventory + per-app risk score | Yes, hardened | Deterministic per-app scoring formula published in-app ("How this is scored") |
| 7 | Per-permission unexpected/expected classification | Yes, hardened | Rule table shipped as static JSON (permission × category → expected set), documented, versioned |
| 8 | Finding detail (why/why-matters/evidence/action) | Yes, hardened | Per-finding-type authored templates, not generic text |
| 9 | Mark as Fixed / Open Settings | Yes | Kept; "Mark as Fixed" requires a real re-check where possible (permission re-scan on resume), else marked "self-resolved, unverified" |
| 10 | Network Health / Connected Devices / App Permissions summary cards | Yes, honest | Only shown when platform+permission allow the signal; "Connected Devices" LAN scan reframed (see §7.5, this is only reliably doable with explicit local network permission + multicast, and must degrade gracefully) |
| 11 | Password Leak Checker (HIBP k-anonymity) | Yes | Real implementation, offline SHA-1 done on-device, only 5-char prefix leaves device |
| 12 | Suspicious Link Scanner | Yes, hardened | Heuristic, on-device rules (not a fabricated "AI" claim) — documented ruleset, optional Google Safe Browsing lookup as enhancement if API key configured |
| 13 | Local Port Scanner ("Desktop app required") | **Cut from mobile home flow.** Kept only as a documented "Desktop Companion (optional, out of scope for MVP)" roadmap item | Don't advertise unshippable functionality in the primary demo |
| 14 | Chrome extension / real-time web protection | **Cut for MVP.** Roadmap only | Same reasoning — don't demo vaporware |
| 15 | Password Vault (local, encrypted, master password) | Yes, hardened | Real AES-GCM via WebCrypto, PBKDF2/Argon2 key derivation from master password, spec'd in §7.9 |
| 16 | Security Habits self-assessment | Yes, expanded | Structured question bank with weighted scoring, mapped explicitly into the score model as `SELF_REPORTED` component (visually distinguished, not blended invisibly into "verified" score) |
| 17 | Streak calendar strip | Yes | Driven by real `scans` table dates only |
| 18 | Timeline of past scans | Yes | New screen (only implied in reference), real requirement per user's IA |

### New solid, real, demoable features NOT in the reference (add these — they are what makes PSS a technical step up)

| # | Feature | Why it's real (not a "random feature") |
|---|---|---|
| N1 | **Breach Monitoring by email (HIBP account breach API, not just password)** | Distinct legitimate API, high demo impact ("your email appeared in 3 breaches"), clearly SELF_REPORTED input (user enters email) → VERIFIED result from external authoritative source |
| N2 | **Password strength & reuse analyzer for Vault entries** | Pure client-side entropy calculation (zxcvbn-style) + duplicate-password detection across vault entries — deterministic, no external call, strong "security engineering" signal to judges |
| N3 | **App permission diffing between scans** ("3 new sensitive permissions since last scan") | Uses already-collected `Apps & Permissions` signal, just diffed over time — cheap to build, very compelling in a demo, shows the timeline isn't decorative |
| N4 | **Screen lock / biometric posture check** (is device lock enabled, what type) via Capacitor `@capacitor/device` + a small native plugin querying `KeyguardManager` (Android) / `LAContext` (iOS) | Real OS-exposed signal, VERIFIED provenance, currently completely missing from the reference app despite being one of the highest-value basic checks |
| N5 | **OS/security-patch freshness scoring with a real staleness curve** (not just "up to date/not") | Reference shows raw patch date with a static green pill; PSS computes days-since-patch and buckets into Fresh / Aging / Stale / Critical with a real severity curve — deterministic and explainable |
| N6 | **Developer Options / USB Debugging / Unknown Sources (sideloading) detection** (Android, via `@capacitor/app` + a small plugin reading `Settings.Global` where permitted, else `SELF_REPORTED` fallback question) | High-signal, classic mobile hardening check missing from reference |
| N7 | **Backup & recovery posture self-assessment** (Do you have account recovery codes stored offline? Is your recovery email/phone current?) | Extends the habits section with a genuinely important category the reference never asks about |
| N8 | **Findings → Remediation Plan with dependency ordering** (Protect tab): findings are ranked not just by severity but by `effort` (quick win vs. involved) so the user gets a "3 quick wins to do right now" list, distinct from "12 more findings" | Solves a real UX gap — reference just lists findings flatly with no prioritization strategy |
| N9 | **Explainable score breakdown screen** ("How is my score calculated?") showing the exact formula, category weights, and every signal that fed into the current number | This single screen is what will make a judge trust the number 89/100 instead of assuming it's decorative — directly answers principle #5 |
| N10 | **Data & Privacy screen**: exactly what PSS collects, where it's stored (on-device vs Supabase), what ever leaves the device (HIBP prefix hash only), with a "Delete all my data" action | Required for CBSE/SIH-style credibility and genuinely differentiates from a hobby project |

---

## 3. Information Architecture & Navigation

Bottom tab bar — 4 tabs, unchanged count from reference (this is correct UX for this domain):

```
┌───────────┬───────────┬───────────┬───────────┐
│   Home    │  Findings │  Protect  │   Vault   │
│  (shield) │  (alert)  │  (wrench) │  (lock)   │
└───────────┴───────────┴───────────┴───────────┘
```

Rename reference's "Alerts"(triangle)/"Tools"(wrench)/"Vault"(lock) tabs to a cleaner mapping that matches the brief's IA:

- **Home** — score hero, category health, last scan, primary "Run Security Check" CTA, streak.
- **Findings** — flat/filterable list of all findings across all scans (severity filter, category filter, status filter: Open / Fixed / Ignored). Tapping opens Finding Detail.
- **Protect** — the prioritized remediation plan (quick wins first), plus the Tools utilities (Password Leak Checker, Link Scanner, Breach Monitor) live here as "Security Tools" section beneath the plan — these are proactive protection actions, not passive findings, so they belong together conceptually (this fixes reference's split between "Tools" tab and "Issues" tab which fragments the mental model).
- **Vault** — password vault (unchanged position, matches reference — good instinct, keep).

Screens reachable via push (not tabs), matching existing scaffold names where possible:

- `ScanScreen` (was `CheckupScreen`) — the staged scan experience.
- `ResultsScreen` — post-scan summary (first thing shown right after a scan completes; different from the persistent Findings tab, this is the "just finished" recap).
- `AppInventoryScreen` (modal/sheet, matches reference pattern).
- `FindingDetailScreen` (was implicit in `PlaybookScreen` — rename/refactor, see §5).
- `TimelineScreen` (new, top-level from Home via the streak/score trend area, or from Settings).
- `SecurityHabitsScreen` (existing, expand question bank per §8).
- `ScoreExplainerScreen` (new — N9).
- `DataPrivacyScreen` (new — N10, reachable from Settings).
- `BreachMonitorScreen` (new — N1, reachable from Protect).
- `SettingsScreen` (existing, add: notification prefs, data controls, about/attribution for HIBP).

This is a strict superset of the existing `App.tsx` tab switch — the coding agent should extend the existing `TabId` union and screen switch rather than rewrite it.

---

## 4. Signal & Capability Model (the technical spine)

### 4.1 Core types (author these first, everything else depends on them)

```ts
type Provenance = 'VERIFIED' | 'PERMISSION_BASED' | 'SELF_REPORTED' | 'UNAVAILABLE';

type Platform = 'android' | 'ios' | 'web';

interface Signal {
  id: string;                // stable key, e.g. 'device.screenLock.enabled'
  category: Category;        // see 4.2
  provenance: Provenance;
  platform: Platform[];      // which platforms this signal can ever be collected on
  collectedAt: string | null;
  value: unknown;            // typed per-signal via a discriminated union in practice
  requiresPermission?: PermissionKey;
}

type Category =
  | 'device'          // OS version, patch age, lock type, encryption, developer options
  | 'apps'            // installed apps, permissions, risk-flagged apps
  | 'network'         // wifi security, VPN presence, DNS
  | 'account'         // 2FA self-report, breach checks, password hygiene
  | 'habits';         // self-assessment questionnaire

interface Finding {
  id: string;
  type: FindingType;         // enum, one per authored template, see §5
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: Category;
  provenance: Provenance;    // inherited from the weakest-provenance signal that produced it
  effort: 'quick' | 'moderate' | 'involved';
  status: 'open' | 'fixed' | 'ignored';
  evidence: EvidenceItem[];  // structured, not just a paragraph
  scanId: string;
  firstSeenScanId: string;   // for diffing (N3)
}
```

### 4.2 Platform Capability Matrix (author as static config, referenced everywhere)

A literal table, e.g. `src/lib/capabilities.ts`, mapping each signal id to: available on Android (native)? available on iOS (native)? Capacitor plugin needed? fallback to SELF_REPORTED question id if unavailable?

Example rows (coding agent must produce the full table covering every signal used by every finding type in §5):

| Signal id | Android | iOS | Mechanism | Fallback if unavailable |
|---|---|---|---|---|
| `device.osVersion` | ✅ | ✅ | `@capacitor/device` `getInfo()` | — |
| `device.securityPatch` | ✅ | ❌ (iOS doesn't expose monthly patch) | `Build.VERSION.SECURITY_PATCH` via small native plugin | iOS: use `osVersion` recency instead, label as PERMISSION_BASED proxy |
| `device.screenLockEnabled` | ✅ (needs custom plugin, `KeyguardManager.isDeviceSecure()`) | ⚠️ partial (`LAContext.canEvaluatePolicy`, detects biometric/passcode availability not literal lock state) | custom native plugin | SELF_REPORTED question |
| `device.diskEncryption` | ✅ (`DevicePolicyManager` on rooted API access is limited; realistically only "assume true if lock enabled" on modern Android) | Always true on iOS (Data Protection) → mark VERIFIED constant | — | — |
| `device.developerOptionsEnabled` | ✅ `Settings.Global.ADB_ENABLED` / `DEVELOPMENT_SETTINGS_ENABLED` | ❌ not exposed | custom plugin | SELF_REPORTED |
| `device.unknownSourcesAllowed` | ✅ (API 26+: per-app `canRequestPackageInstalls`) | N/A (not applicable, App Store only) | custom plugin | — |
| `apps.installedList` | ✅ `PackageManager.getInstalledPackages` | ❌ iOS never exposes 3rd-party app inventory | native plugin (Android only) | iOS: this whole category becomes UNAVAILABLE with an explanatory empty state, not hidden silently |
| `apps.permissionsPerApp` | ✅ | ❌ | native plugin (Android only) | same as above |
| `network.wifiSecurityType` | ✅ (`WifiManager`, needs location permission on modern Android) | ⚠️ limited (`NEHotspotHelper`/`CNCopySupportedInterfaces`, requires special entitlement, effectively unavailable to a normal app) | plugin + `ACCESS_FINE_LOCATION` | SELF_REPORTED "is this a network you trust?" |
| `network.vpnActive` | ✅ (`ConnectivityManager` transport check) | ✅ (`NEVPNManager` status, or transport check) | `@capacitor/network` extension or small plugin | — |
| `account.twoFactorEnabled.<service>` | N/A (OS can't know) | N/A | — | Always SELF_REPORTED via Habits |
| `account.breachedEmail` | ✅ | ✅ | HIBP API call (network signal, external, `VERIFIED` provenance because the source is authoritative even though input is self-reported) | — |
| `account.passwordReused` | ✅ | ✅ | Vault-local computation | — |

This table is the load-bearing artifact of the whole app. It must be written and reviewed before any screen is built, because it determines which UI states are even possible per platform.

**Explicit rule for the coding agent:** never build a component that assumes a signal exists; always branch on the capability table. Every category screen must have a real "not available on this device/OS" state that is designed, not an afterthought (this satisfies principle #4 and stops iOS builds from looking broken).

---

## 5. Findings Engine

### 5.1 Finding type registry

Each `FindingType` is an authored object, not generated text:

```ts
interface FindingTemplate {
  type: FindingType;
  title: (ctx: FindingContext) => string;
  whyDetected: (ctx: FindingContext) => string;
  whyItMatters: string;                    // mostly static, doesn't need per-instance context
  evidence: (ctx: FindingContext) => EvidenceItem[];
  recommendedActions: RecommendedAction[]; // ordered, each with a type: 'open_settings' | 'open_url' | 'mark_fixed' | 'in_app_action'
  severityRule: (ctx: FindingContext) => Severity; // deterministic function of the signal values, not a fixed constant
  effort: Effort;
}
```

### 5.2 Minimum finding-type set to ship (each needs its own authored template — this is the actual "content design" work, budget real time for it)

**Device category**
- `STALE_SECURITY_PATCH` (severity scales with days-since-patch: <30=info, 30-90=low, 90-180=medium, 180-365=high, >365=critical — this is N5)
- `SCREEN_LOCK_DISABLED`
- `WEAK_LOCK_TYPE` (e.g. swipe/none vs PIN/biometric — Android only, honest about iOS limitation)
- `DEVELOPER_OPTIONS_ENABLED`
- `UNKNOWN_SOURCES_ENABLED`
- `DISK_ENCRYPTION_DISABLED` (Android low-end devices only; iOS always passes, shown as VERIFIED info)

**Apps category**
- `APP_UNEXPECTED_PERMISSION` (per app, per permission — matches reference's core pattern)
- `APP_SUSPICIOUS_PERMISSION_COMBO` (rule-based combos: SMS+Internet, Contacts+Location+Mic, Camera+Contacts, etc. — ship a documented combo ruleset, minimum 6 combos)
- `APP_NEW_SENSITIVE_PERMISSION_SINCE_LAST_SCAN` (N3)
- `APP_SIDELOADED_FLAGGED` (installed outside Play Store, Android only)
- `APP_UNUSED_WITH_SENSITIVE_PERMISSIONS` (not opened in >60 days but retains e.g. location/mic — requires `PackageManager` last-used-time, Android 9+ `UsageStatsManager`, graceful fallback if usage-access permission not granted)

**Network category**
- `UNTRUSTED_WIFI_SELF_REPORTED`
- `NO_VPN_ON_PUBLIC_WIFI` (only fires if user self-reports "this is public wifi" — do not infer network trust without user input, that would be an unverifiable claim)

**Account category**
- `EMAIL_IN_KNOWN_BREACH` (N1, real HIBP breach API)
- `PASSWORD_FOUND_IN_LEAK` (existing HIBP password API)
- `PASSWORD_REUSED_ACROSS_VAULT_ENTRIES` (N2)
- `WEAK_PASSWORD_IN_VAULT` (N2, zxcvbn score ≤2)
- `TWO_FACTOR_DISABLED_SELF_REPORTED`
- `NO_RECOVERY_METHOD_CONFIGURED_SELF_REPORTED` (N7)

**Habits category** (weighted questionnaire, §8) produces findings like `POOR_PASSWORD_HABITS`, `NO_PASSWORD_MANAGER`, `LOW_PHISHING_AWARENESS`, `PUBLIC_DEVICE_SHARING`.

Every finding, regardless of category, renders through **one shared `FindingDetailScreen` component** driven entirely by the `FindingTemplate` + `FindingContext` — do not build bespoke detail screens per finding type. This is both an engineering and a design-consistency requirement.

### 5.3 Finding Detail screen layout (kept from reference, hardened)

1. Severity badge + icon (color per severity token, §9)
2. Title (finding-specific, generated from template — not the app name alone like reference's "IndSMART Privacy Analysis", but action-oriented: e.g. "IndSMART requests unusual sensitive permissions")
3. Provenance chip (new — VERIFIED/PERMISSION_BASED/SELF_REPORTED, small, top-right of card) — this alone is a differentiator vs. reference which never discloses this
4. "Why we detected this" — real per-instance text
5. "Why this matters" — static per-type
6. Evidence — structured list (not a wall of text like reference's screenshot 6, which crams four separate facts into one run-on paragraph). Each evidence item is its own row with an icon.
7. "What you can do" — numbered steps (kept, this pattern works)
8. Primary action button (Open Settings / deep link where OS allows) + secondary "Mark as Fixed"
9. On "Mark as Fixed": if the signal is re-checkable (`VERIFIED`/`PERMISSION_BASED`), trigger a real re-check on next app resume and auto-confirm/reopen the finding; if `SELF_REPORTED`, just flip status with a small "self-reported, not verified" tag retained permanently on that finding so it never silently becomes indistinguishable from a verified fix.

---

## 6. Scoring Engine (must be fully deterministic and explainable — this is the #1 credibility fix vs. reference)

### 6.1 Model

```
OverallScore = round(
  Σ over categories c of ( weight[c] * categoryScore[c] )
)
```

- Categories: `device`, `apps`, `network`, `account`, `habits`.
- Default weights (must sum to 1.0, stored as versioned config so it's transparent and tweakable): `device 0.25, apps 0.25, network 0.15, account 0.20, habits 0.15`.
- `categoryScore[c] = 100 - Σ over open findings in c of (severityPenalty(finding.severity) * confidenceMultiplier(finding.provenance))`, floored at 0.
- `severityPenalty`: critical=40, high=20, medium=10, low=5, info=0.
- `confidenceMultiplier`: VERIFIED=1.0, PERMISSION_BASED=1.0, SELF_REPORTED=0.6, UNAVAILABLE findings never exist (can't detect what you can't see).
- A category with **zero collectible signals on this platform** (e.g. `apps` on iOS) is excluded from the weighted sum entirely and its weight is redistributed proportionally across the remaining categories — this must be visible to the user ("Apps category not scored — not available on iOS") rather than silently defaulting to 100.

### 6.2 Score Explainer screen (N9) — required, not optional

Shows:
- The exact formula above, in plain language, with the current run's numbers substituted in.
- A table: category → weight (adjusted for platform) → category score → point contribution → number of findings feeding it → number of SELF_REPORTED vs VERIFIED findings in it.
- A link to "view the finding rule reference" (a static, versioned page listing every FindingType, its severity rule, and its permission-combo rules — this is the artifact a judge will specifically want to see to validate "deterministic and explainable").

### 6.3 Trend / Timeline

- `ScoreSnapshot { scanId, timestamp, overallScore, categoryScores, findingCounts }` stored per completed scan.
- Home hero trend and Timeline screen chart **only render a line/sparkline once ≥2 snapshots exist**; with exactly 1 snapshot show a single point + "run another scan to see your trend"; with 0, show the pre-scan empty state.
- Never synthesize interpolated points between real scans.

---

## 7. Screen-by-Screen Spec

### 7.1 Home
Single-column, generous spacing (see §9). Order top to bottom:
1. App bar: PSS wordmark + avatar (kept from reference, fine).
2. **Score Hero** — one card. Large number, `/100`, one-line qualitative label derived from a fixed bucket table (`90-100 Excellent`, `75-89 Good`, `55-74 Needs Attention`, `<55 At Risk`) — not the reference's oddly-specific "Your device looks good" free text, use the bucket label consistently everywhere the score appears. Delta vs previous scan shown only if a previous scan exists. Tapping the hero opens `ScoreExplainerScreen`.
3. **Streak strip** (kept from reference) — 7-day strip driven by real scan dates, filled = a scan happened that day, today ring-highlighted regardless of scan status.
4. **Category health** — one row per category (not 3 disconnected cards like reference), each row: icon, label, score/100, thin progress bar, small finding-count badge, chevron → filtered Findings list. iOS shows `apps`/`network` rows in a muted "Not available on iOS" state rather than omitting them (transparency > hiding limitations).
5. **Primary CTA**: "Run Security Check" full-width, high-contrast button — the single most prominent interactive element on the screen (fixes reference's 2-way split between "Scan Device" and "Security Habits" competing equally; Habits becomes a secondary link/card below, not equal-weight).
6. **Top Findings preview** — max 3, only `critical`/`high`, "View all N findings" link into Findings tab. Empty state if none: a calm confirmation, not blank space.
7. **Last scan meta**: timestamp + "X findings resolved since last scan" if applicable.
Cut: the reference's long-form "Why Device Hygiene Matters" / "The Human Element" educational paragraphs — move that content into `LearnScreen` (already scaffolded) rather than cluttering Home; Home is a status screen, not a blog.

### 7.2 Scan (staged sweep)
Real sequential pipeline, not a fixed-duration fake progress bar. Stages, each a real async unit of work against the capability table:
`Device → Apps (Android only) → Network → Configuration → Account (checks cached vault/email if provided) → Habits (only if stale >30 days, else skipped with a note)`.
Each stage shows: icon, label, live status (`pending` spinner → `done` check → `skipped (not available)` muted), and a running count of findings discovered so far (small, subtle, builds anticipation without spoiling Results).
On completion → auto-navigate to Results.
Must handle: permission denial mid-scan (show which stage was blocked and why, offer to grant + retry that stage, do not abort the whole scan), and app backgrounding mid-scan (resume/checkpoint per stage).

### 7.3 Results (post-scan recap)
Immediately after a scan: big score, qualitative label, delta vs previous, single finding count (must equal the count in Findings tab — enforce via one shared selector, not two separately computed numbers as in the reference bug). Category summary cards → each opens Findings filtered to that category. CTA: "View Findings" (primary) + "View App Inventory" (secondary, Android only).

### 7.4 Findings (tab)
Filter bar: severity (multi-select chips), category (multi-select), status (Open/Fixed/Ignored segmented control). List rows: severity dot, title, category tag, provenance chip, "New since last scan" badge when applicable (N3). Sort: severity desc by default, toggle to "Recently detected."

### 7.5 App Inventory (Android-only modal, matches reference pattern, hardened)
Search bar (kept). Each app row expandable (kept, good pattern) showing: risk score `/100` computed via the same deterministic engine (documented formula: base 100, minus per unexpected-permission penalty minus per suspicious-combo penalty), permission analysis table (kept, this table is the strongest single UI element in the reference — reuse the exact information density: permission name / granted-or-not / expected-or-unexpected tag / one-line reason). "Manage in Settings" deep-links to the real Android app-info settings screen via an intent, not a stub.
On iOS: this whole screen is unreachable; the Tools/Protect entry point that would open it instead shows "App-level scanning isn't available on iOS because Apple doesn't expose an installed-app inventory to third-party apps" — an explicit, worded limitation, not a hidden button.

### 7.6 Protect (tab)
Two sections:
1. **Remediation Plan** (N8): "Quick wins" (effort=`quick`, sorted by severity) shown as a checklist first, then "Everything else" collapsed by default. Completing items here just deep-links into the same `FindingDetailScreen`/`Mark as Fixed` flow — Protect is a curated view, not a separate data model.
2. **Security Tools**: Password Leak Checker, Suspicious Link Scanner, Breach Monitor (N1) — each as a card with input + inline result, matching reference's tool-card pattern but with real backing logic per §7.7-7.8 and N1.

### 7.7 Password Leak Checker
On-device SHA-1 of the entered password (WebCrypto `crypto.subtle.digest` doesn't support SHA-1 natively in all environments reliably for this use-case — use `js-sha1` or equivalent small dependency), send only first 5 hex chars to `https://api.pwnedpasswords.com/range/{prefix}`, match full suffix locally, never transmit the password or full hash. Show breach count if found, with an explanation of k-anonymity so the "100% Private" claim in the reference is actually substantiated in-app, not just asserted.

### 7.8 Suspicious Link Scanner
Client-side heuristic ruleset (document every rule): punycode/homoglyph domains, suspicious TLD list, IP-literal URLs, excessive subdomain depth, known URL-shortener without disclosed target, mismatched displayed-vs-actual domain if pasted from rich text. Output a risk band (Low/Medium/High) with the specific triggered rules listed as evidence — same evidence-list pattern as Findings, for UI consistency. Label clearly as "Heuristic Analysis" (already good in the reference's subtitle, keep that framing) — do not claim it's exhaustive or AI-verified.

### 7.9 Vault
- Master password → PBKDF2 (≥310,000 iterations per current OWASP guidance, or Argon2id if a suitable WASM lib is available) derives an AES-256-GCM key; vault entries encrypted at rest in local storage (Capacitor Preferences/SQLite, never Supabase, never plaintext).
- Unlock screen: `Unlock` button disabled until password field non-empty (fixes reference's ambiguous grey-button state), inline error on wrong password (no attempt counter needed but a soft warning after 5 failed attempts), auto-relock after N minutes background or on app switch (configurable in Settings).
- Vault list: entry rows with copy-to-clipboard (auto-clear clipboard after 30s, disclosed to user), reveal-password toggle, per-entry password strength badge (N2) and reused-password warning badge (N2) computed on unlock.
- Add/Edit entry: site, username, password (with strength meter live as typed), optional notes.
- Explicit non-goal: no cloud sync of vault contents in MVP — state this in Data & Privacy screen (N10) as a trust-building disclosure, not a limitation to hide.

### 7.10 Security Habits (self-assessment)
See §8 for the full question bank. UI: one question per screen or grouped by section with progress indicator (choose grouped-by-section for a faster demo — 5 sections, ~20-25 questions total, each section takes <60s). Results feed directly into `habits` category signals with `SELF_REPORTED` provenance, generating the account/habits findings in §5.2.

### 7.11 Timeline
List of past scans (date, score, delta, finding count, resolved-since-last count). Tapping a past scan opens a read-only Results view for that scan (reuses `ResultsScreen` in a historical mode). Score-over-time chart above the list, subject to the ≥2-points rule in §6.3.

### 7.12 Score Explainer (N9)
Per §6.2.

### 7.13 Data & Privacy (N10)
Table: data type → where stored (on-device only / Supabase / never leaves device) → purpose → retention. "Delete all my data" button: clears local scan history, vault (with a strong confirm since this is destructive and unrecoverable), and Supabase-side rows for the user, calling a real Supabase delete, not a stub.

### 7.14 Breach Monitor (N1)
Email input → HIBP breach-account API call (requires an API key in production — spec this as a Supabase Edge Function proxy so the key is never shipped in the client bundle) → list of breach names, dates, compromised data types. Each breach becomes a `EMAIL_IN_KNOWN_BREACH` finding instance.

---

## 8. Security Habits — Question Bank (author in full, weighted)

Five sections, each contributing to a `habits` sub-score used identically to other category scores (weighted penalty per "bad" answer, same severity/weight machinery as §6, just always `SELF_REPORTED`):

1. **Authentication** — 2FA usage (per major account type: email, banking, social — multi-select "which of these have 2FA enabled"), authenticator app vs SMS-based 2FA (SMS flagged as weaker, still credited partially), biometric lock usage.
2. **Password Hygiene** — password manager usage, password reuse admission, password change frequency for critical accounts, passphrase length habits.
3. **Recovery & Backup** — recovery codes stored offline, recovery email/phone currency, device backup enabled, backup encryption awareness.
4. **Phishing & Social Engineering Awareness** — a short 4-5 item micro-quiz (scenario based: "You get an SMS saying your bank account is locked, what do you do?") scored right/wrong, not just self-report — this is stronger signal quality than pure self-report and should be flagged distinctly in evidence as "assessed" rather than "declared."
5. **Sharing & Physical Security** — device sharing with others, public Wi-Fi habits, screen lock timeout length, app permission review frequency admission.

Each question maps to exactly one Finding type (or contributes a fractional weight into a composite one like `POOR_PASSWORD_HABITS`) — author this mapping table explicitly before building the UI so the questionnaire and the findings engine stay in sync.

---

## 9. Design System

### 9.1 Typography — hard replacement for reference's script font
- Primary typeface: a clean grotesque/humanist sans for UI text — **Inter** (already loaded in `index.html` per the existing project — keep it, it's the right choice, just actually use it everywhere including headings, unlike whatever is currently overriding it toward a script look in the reference screenshots).
- Numerals (score, counts): tabular figures, slightly heavier weight (600-700) at large sizes for the hero score.
- No decorative/script/handwritten font anywhere. This is non-negotiable per the brief and per the credibility argument in §0.
- Scale (base 16px, ratio ~1.25): 12 / 13 / 15 / 16 / 20 / 25 / 31 / 39 / 49px, weights 400/500/600/700 only — no 300 (too thin for a security-critical numeral to feel authoritative), no 800+ (too heavy, reads as marketing not product).

### 9.2 Color & Severity System
- Base: near-black `#0B0F14` / near-white `#F7F8FA` neutral scale (10 steps), no colored-tinted neutrals (this avoids the reference's slightly purple-navy cast that competes with severity colors).
- Accent (brand, used sparingly — CTAs, active tab, links): a single deep blue or teal, NOT the reference's orange-as-primary (orange should be reserved purely for the "medium" severity token and using it as brand-CTA color too creates ambiguity between "this is a button" and "this is a warning").
- Severity tokens (must be distinct from brand color and from each other at a glance, and colorblind-safe — verify with a simulator):
  - `critical` — red (`#DC2626`-family)
  - `high` — orange-red (`#EA580C`-family)
  - `medium` — amber (`#D97706`-family)
  - `low` — blue-grey (`#64748B`-family, deliberately desaturated — low severity should not visually compete with the reds/oranges)
  - `info` — neutral grey
  - success/verified-good — green (`#16A34A`-family), used ONLY for genuinely good states, never as a default
- Provenance chip colors: distinct, muted, secondary to severity — small pill, outline style, not filled, so it never competes visually with severity color.

### 9.3 Spacing & Layout
- 4px base unit. Card padding 16-20px. Section vertical rhythm 24-32px between major blocks (reference is inconsistent/cramped in places, e.g. Image 1's card stack).
- Max 2 cards per row on mobile only when they're short/glanceable (reference's Scan Device / Security Habits pairing on Home — fine); everything else full-width single column, matching the "no card sprawl" fix from §0.
- Corner radius: 16px for cards, 12px for buttons/inputs, 24px+ reserved only for the pill-shaped bottom nav (kept from reference — that one large pill nav is a nice, restrained touch, don't over-round everything else too).

### 9.4 Iconography
- Single consistent icon set (`lucide-react`, already a dependency in `package.json` — use it exclusively, do not mix icon styles).
- Severity uses filled icons; neutral/info uses outline icons — one consistent rule, not ad hoc.

### 9.5 Motion
- Score number count-up animation on Results/Home (once, on first render after a scan, not on every screen focus).
- Scan stage transitions: real state-driven progress, no decorative particle/pulse effects.
- Respect `prefers-reduced-motion`.

---

## 10. Cross-cutting Technical Requirements

- **State/data layer**: single `useScanEngine` hook or equivalent service orchestrating signal collection → finding generation → scoring, with results persisted to Supabase (`scans`, `findings`, `score_snapshots` tables) and mirrored to local cache for offline viewing of the last scan.
- **Supabase schema** (new tables needed, coding agent to design DDL): `scans(id, user_id, started_at, completed_at, status)`, `findings(id, scan_id, type, severity, category, provenance, status, evidence jsonb, first_seen_scan_id)`, `score_snapshots(id, scan_id, overall_score, category_scores jsonb)`, `habit_responses(id, user_id, scan_id, question_id, answer jsonb)`. Vault stays fully local, never in Supabase.
- **Permission requests**: never request a permission until the exact moment its scan stage runs, with a pre-permission explainer sheet ("PSS needs Usage Access to check which apps haven't been opened recently — this stays on your device") before the OS prompt — this is both good UX and required for Play Store policy compliance.
- **Native plugins required** (custom, beyond stock Capacitor plugins): a small Android plugin for `screenLock/devOptions/unknownSources/securityPatch/usageStats`; a small iOS plugin for `screenLock proxy via LAContext`. Spec these as their own Capacitor plugin package (`packages/pss-native-android`), not inline hacks in the web layer.
- **Testing**: the scoring engine and finding-rule functions must be pure and unit-tested (deterministic by design, easy to test) — this is a cheap, high-value credibility item for an SIH demo/judge Q&A ("show me your tests").

---

## 11. Implementation Sequence (phased, for the coding agent)

**Phase 0 — Foundations (no UI yet)**
1. Author core types (§4.1), capability matrix (§4.2), finding-type registry skeleton (§5.1) with stub templates.
2. Author scoring engine (§6) as pure functions + unit tests.
3. Supabase schema migration for `scans/findings/score_snapshots/habit_responses`.

**Phase 1 — Scan pipeline (real signals, Android first since it has the richest capability set)**
4. Implement Device category signal collectors (start with what's available via stock `@capacitor/device`, then the custom native plugin for screenLock/devOptions/unknownSources/patch).
5. Implement Apps category collector (Android package/permission enumeration) + the permission-expectation rule table + per-app risk scoring.
6. Implement Network category collector (wifi/VPN where available) + self-reported fallback question wiring.
7. Wire Habits questionnaire (§8) end-to-end into signals/findings.
8. Implement full finding-type registry content (§5.2) — this is largely content/copy authoring work, budget accordingly.

**Phase 2 — Core screens**
9. Home (§7.1), Scan (§7.2), Results (§7.3), Findings tab (§7.4), Finding Detail shared component (§5.3).
10. App Inventory (§7.5).
11. Score Explainer (§7.12), Timeline (§7.11).

**Phase 3 — Protect & Tools**
12. Protect tab remediation plan (§7.6) built on top of the existing findings data (no new backend needed, purely a selector/sort layer).
13. Password Leak Checker (§7.7), Suspicious Link Scanner (§7.8).
14. Breach Monitor (§7.14) + Supabase Edge Function proxy for the HIBP key.

**Phase 4 — Vault**
15. Crypto layer (PBKDF2/Argon2 + AES-GCM), local storage schema.
16. Vault screens (§7.9), password strength/reuse findings wiring (N2).

**Phase 5 — Trust & polish layer**
17. Data & Privacy screen (§10, N10).
18. Design system pass: typography/color/spacing audit against §9 across every screen built in Phases 2-4 (do this as an explicit pass, not incrementally, to guarantee consistency).
19. iOS capability degradation pass: walk every screen with the `ios` row of the capability matrix and verify every "unavailable" state is designed, not blank.
20. Empty/loading/error/permission-denied state audit across all screens (principle from the original brief — do this as its own checklist pass at the end).

**Phase 6 — Demo readiness**
21. Seed a realistic demo account/device profile so a judge can see a populated Home/Findings/Timeline without needing 7 days of real usage (a "demo mode" data seeder is acceptable and should be clearly internal/dev-only, never shipped as fake data in the real scan path).
22. Rehearse the exact judge walkthrough: Home → Run Scan (real, on a real Android device) → Results → tap into 2-3 real findings → Score Explainer → Protect quick wins → Vault → Timeline. Time it; it must land the "understand posture in 3-5 seconds" claim at the very first screen.

---

## 12. Explicit Non-Goals for MVP (say so, don't silently drop)

- Local Port Scanner / desktop companion (reference's own screen admits it needs a desktop app — cut from the mobile MVP, document as roadmap).
- Chrome extension real-time web protection (cut from MVP, roadmap).
- Cloud sync of Vault contents (stays local-only by design, not a missing feature).
- Any LLM/AI-generated finding text at runtime (deliberately excluded per principle #6/#5 — authored templates only).

---

*End of specification.*
