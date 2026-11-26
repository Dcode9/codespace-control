import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.GITHUB_CODESPACE_TOKEN;
const REPO = "Dcode9/antigravity-devbox";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-control-secret") || req.nextUrl.searchParams.get("secret");
  if (process.env.CONTROL_SECRET && secret !== process.env.CONTROL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!TOKEN) {
    return NextResponse.json({ error: "Missing GITHUB_CODESPACE_TOKEN" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.github.com/user/codespaces", {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream GitHub authentication error or rate limit", status: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    const cs = (data.codespaces || []).find(
      (c: any) => c.repository?.full_name === REPO
    );

    if (!cs) {
      return NextResponse.json({
        exists: false,
        state: "None",
        name: null,
        web_url: null,
      });
    }

    return NextResponse.json({
      exists: true,
      state: cs.state,
      name: cs.name,
      web_url: cs.web_url,
      machine: cs.machine?.display_name,
      last_used: cs.last_used_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to connect to GitHub" }, { status: 500 });
  }
}
