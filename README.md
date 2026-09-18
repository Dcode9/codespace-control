# Codespace Control Panel

Simple GUI + API to start / stop the Antigravity Codespace (`Dcode9/antigravity-devbox`).

## Setup

1. Create a **classic** GitHub Personal Access Token with the `codespace` scope:
   https://github.com/settings/tokens

2. Deploy this repo to Vercel.

3. In the Vercel project → Settings → Environment Variables, add:

   | Name | Value |
   |------|-------|
   | `GITHUB_CODESPACE_TOKEN` | your PAT |

4. (Optional) Add a custom domain `cs.d-verse.in` in Vercel.

5. Open the site → you will see live status + Start / Stop buttons.

## Also available

GitHub Actions workflow in the `antigravity-devbox` repo (Actions tab → Codespace Control).

## How it works

- `/api/status` – returns current state of the codespace for this repo
- `/api/control` – POST `{ "action": "start" | "stop" }`
- When the Codespace starts, `postStartCommand` automatically launches AGY remote-control.
