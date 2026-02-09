# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Clawfish is a lightweight, zero-dependency landing page platform for user registration and viral referral/invitation mechanics. The UI is in Chinese. Users register, then get redirected to an invite center where they receive an invite code to share.

## Commands

```bash
npm start          # Start the server (Node.js 18+ required)
```

Server runs at `http://localhost:8080` (configurable via `PORT` env var).

There is no build step, no linter, and no test framework configured. The app is vanilla HTML/CSS/JS with a plain Node.js HTTP server.

## Architecture

**Backend**: Single-file Node.js HTTP server (`server.js`) using only built-in modules (`http`, `fs`, `path`, `crypto`). No external dependencies.

**Frontend**: Three static HTML pages with corresponding JS files in `assets/`. No framework — pure vanilla JS.

**Data storage**: JSON file at `data/agents.json` (git-ignored). Loaded/saved synchronously on each request.

### Request Flow

1. `index.html` + `assets/main.js` — Registration form → `POST /api/register` → returns `nextPath` with invite access token
2. `invite.html` + `assets/invite.js` — Reads `token` from URL query → `GET /api/invite-session?token=...` → displays invite code/link, can request verification code via `POST /api/verification-code`
3. `admin.html` + `assets/admin.js` — Protected by `x-admin-key` header → `GET /api/admin/stats` → shows registration stats

### API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/register` | None | Register new agent (contact + password) |
| GET | `/api/invite-session?token=` | Token in query | Get invite code for registered agent |
| POST | `/api/verification-code` | None (requires valid agentId) | Issue 6-digit verification code |
| GET | `/api/admin/stats` | `x-admin-key` header | Registration and verification stats |

### Key Backend Details

- Passwords are SHA-256 hashed (via `crypto`)
- Invite codes: 8-char alphanumeric (excludes ambiguous chars I, O, 0, 1)
- Invite access tokens: 40-char random hex
- Verification codes: 6-digit random numbers
- Request body limit: 1MB
- Static file serving handles HTML, CSS, JS, JSON, PNG, JPG, SVG, ICO with path traversal protection
- Route `/invite/<code>` serves `invite.html` (client-side handles the code)

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `8080` | Server listen port |
| `ADMIN_KEY` | `clawfish-admin` | Admin stats endpoint authentication |

## Data Model (agents.json)

Each agent record contains: `agentId` (UUID), `contact`, `passwordHash`, `inviteCode`, `inviteAccessToken`, `inviteTokenIssuedAt`, `verificationCode`, `verificationIssuedAt`, `registeredAt`.

## Styling

CSS uses a glassmorphism design with CSS variables. Primary accent: `#f25c27`. Fonts: Space Grotesk (headings) + Noto Sans SC (body, Chinese-optimized). Mobile breakpoint at 800px. Staggered fade-in animations via `.animate` class.
