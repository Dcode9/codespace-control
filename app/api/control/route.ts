import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.GITHUB_CODESPACE_TOKEN;
const REPO = "Dcode9/antigravity-devbox";
const REPO_ID = 1375646022;
const WORKFLOW_FILE = "codespace-control.yml";

async function gh(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { res, json };
}

async function getCodespace() {
  const { json } = await gh("/user/codespaces");
  return (json?.codespaces || []).find(
    (c: any) => c.repository?.full_name === REPO
  );
}

/** Trigger Actions workflow that SSHs into the Codespace and runs start-remote.sh */
async function dispatchBootAgy() {
  const { res, json } = await gh(
    `/repos/${REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: "POST",
      body: JSON.stringify({
        ref: "main",
        inputs: { action: "boot-agy" },
      }),
    }
  );
  // 204 = accepted
  return { ok: res.status === 204 || res.ok, status: res.status, body: json };
}

export async function POST(req: NextRequest) {
  if (!TOKEN) {
    return NextResponse.json(
      { error: "Missing GITHUB_CODESPACE_TOKEN" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (!["start", "stop"].includes(action)) {
    return NextResponse.json(
      { error: "action must be start or stop" },
      { status: 400 }
    );
  }

  let cs = await getCodespace();

  if (!cs && action === "start") {
    const { res, json } = await gh("/user/codespaces", {
      method: "POST",
      body: JSON.stringify({ repository_id: REPO_ID }),
    });
    const boot = await dispatchBootAgy();
    return NextResponse.json({
      ok: res.ok,
      action: "create+start",
      result: json,
      agy_boot_workflow: boot,
      note: "Codespace creating. Actions will SSH and run agy remote-control start — no browser open needed. Wait 2–3 min then check Hub.",
    });
  }

  if (!cs) {
    return NextResponse.json({ error: "No codespace found" }, { status: 404 });
  }

  const url =
    action === "start"
      ? `/user/codespaces/${cs.name}/start`
      : `/user/codespaces/${cs.name}/stop`;

  const { res, json } = await gh(url, { method: "POST" });

  let boot = null;
  if (action === "start") {
    boot = await dispatchBootAgy();
  }

  return NextResponse.json(
    {
      ok: res.ok,
      action,
      result: json,
      agy_boot_workflow: boot,
      note:
        action === "start"
          ? "Started Codespace + triggered boot-agy workflow (SSH runs start-remote.sh). Wait ~2–3 min, then open https://antigravity.google.com → codespace-cloudbox. No need to open the Codespace in the browser."
          : undefined,
    },
    { status: res.status }
  );
}
