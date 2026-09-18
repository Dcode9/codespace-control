import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.GITHUB_CODESPACE_TOKEN;
const REPO = "Dcode9/antigravity-devbox";
const REPO_ID = 1375646022; // antigravity-devbox

async function getCodespace() {
  const res = await fetch("https://api.github.com/user/codespaces", {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  const data = await res.json();
  return (data.codespaces || []).find(
    (c: any) => c.repository?.full_name === REPO
  );
}

export async function POST(req: NextRequest) {
  if (!TOKEN) {
    return NextResponse.json({ error: "Missing GITHUB_CODESPACE_TOKEN" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (!["start", "stop"].includes(action)) {
    return NextResponse.json({ error: "action must be start or stop" }, { status: 400 });
  }

  let cs = await getCodespace();

  // Create if missing and starting
  if (!cs && action === "start") {
    const createRes = await fetch("https://api.github.com/user/codespaces", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ repository_id: REPO_ID }),
    });
    const created = await createRes.json();
    return NextResponse.json({ ok: true, action: "create+start", result: created });
  }

  if (!cs) {
    return NextResponse.json({ error: "No codespace found" }, { status: 404 });
  }

  const url =
    action === "start"
      ? `https://api.github.com/user/codespaces/${cs.name}/start`
      : `https://api.github.com/user/codespaces/${cs.name}/stop`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  const result = await res.json();
  return NextResponse.json({ ok: res.ok, action, result }, { status: res.status });
}
