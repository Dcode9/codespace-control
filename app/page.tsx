"use client";

import { useEffect, useState, useCallback } from "react";

type Status = {
  exists: boolean;
  state: string;
  name: string | null;
  web_url: string | null;
  machine?: string;
  last_used?: string;
};

export default function Home() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justStarted, setJustStarted] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/status");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch status");
      setStatus(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 8000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  async function doAction(action: "start" | "stop") {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      if (action === "start") setJustStarted(true);
      if (action === "stop") setJustStarted(false);
      setTimeout(fetchStatus, 1500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  const state = status?.state || "Unknown";
  const isRunning = ["Available", "Running", "Starting"].includes(state);
  const isStopped = ["Shutdown", "Stopped", "None"].includes(state);

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.title}>Antigravity Codespace</h1>
        <p style={styles.subtitle}>Dcode9 / antigravity-devbox</p>

        {loading ? (
          <p style={styles.status}>Loading…</p>
        ) : (
          <>
            <div style={styles.statusBox}>
              <span style={styles.label}>Codespace</span>
              <span
                style={{
                  ...styles.badge,
                  background: isRunning ? "#16a34a" : isStopped ? "#64748b" : "#d97706",
                }}
              >
                {state}
              </span>
            </div>

            {status?.name && (
              <p style={styles.meta}>Name: {status.name}</p>
            )}
            {status?.machine && (
              <p style={styles.meta}>Machine: {status.machine}</p>
            )}

            <div style={styles.buttons}>
              <button
                style={{
                  ...styles.btn,
                  ...styles.start,
                  opacity: actionLoading || isRunning ? 0.6 : 1,
                }}
                disabled={actionLoading || isRunning}
                onClick={() => doAction("start")}
              >
                {actionLoading ? "Working…" : "Start"}
              </button>
              <button
                style={{
                  ...styles.btn,
                  ...styles.stop,
                  opacity: actionLoading || isStopped ? 0.6 : 1,
                }}
                disabled={actionLoading || isStopped}
                onClick={() => doAction("stop")}
              >
                Stop
              </button>
            </div>

            {isRunning && (
              <div style={styles.progressBox}>
                <p style={styles.progressTitle}>Watch agent progress</p>
                <a
                  href="https://antigravity.google.com"
                  target="_blank"
                  rel="noreferrer"
                  style={styles.hubBtn}
                >
                  Open Antigravity Hub →
                </a>
                <p style={styles.progressHint}>
                  After Start, wait ~30–60s for AGY + remote-control to boot,
                  then open the Hub and select instance{" "}
                  <strong>codespace-cloudbox</strong>.
                </p>
                {justStarted && (
                  <p style={styles.progressHint}>
                    Just started — give the Codespace a minute before the Hub shows it.
                  </p>
                )}
              </div>
            )}

            {status?.web_url && isRunning && (
              <a
                href={status.web_url}
                target="_blank"
                rel="noreferrer"
                style={styles.link}
              >
                Open Codespace terminal (debug) →
              </a>
            )}
          </>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <p style={styles.hint}>
          On boot: tmux starts <code>agy --remote-control</code> (or sends{" "}
          <code>/remote-control</code>). Use the Hub for live progress — not the Codespace UI.
        </p>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f172a",
    fontFamily: "system-ui, -apple-system, sans-serif",
    padding: 16,
  },
  card: {
    background: "#1e293b",
    borderRadius: 16,
    padding: "32px 28px",
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
    textAlign: "center",
  },
  title: {
    margin: 0,
    fontSize: 22,
    color: "#f8fafc",
    fontWeight: 700,
  },
  subtitle: {
    margin: "6px 0 24px",
    color: "#94a3b8",
    fontSize: 14,
  },
  statusBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  label: {
    color: "#94a3b8",
    fontSize: 14,
  },
  badge: {
    color: "#fff",
    padding: "4px 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
  },
  meta: {
    color: "#64748b",
    fontSize: 12,
    margin: "4px 0",
  },
  buttons: {
    display: "flex",
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  btn: {
    flex: 1,
    border: "none",
    borderRadius: 10,
    padding: "12px 0",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    color: "#fff",
  },
  start: {
    background: "#16a34a",
  },
  stop: {
    background: "#dc2626",
  },
  progressBox: {
    marginTop: 8,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    background: "#0f172a",
    border: "1px solid #334155",
  },
  progressTitle: {
    margin: "0 0 10px",
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: 600,
  },
  hubBtn: {
    display: "inline-block",
    background: "#2563eb",
    color: "#fff",
    textDecoration: "none",
    padding: "10px 16px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
  },
  progressHint: {
    margin: "10px 0 0",
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 1.45,
  },
  link: {
    display: "inline-block",
    marginTop: 8,
    color: "#38bdf8",
    textDecoration: "none",
    fontSize: 13,
  },
  error: {
    color: "#f87171",
    fontSize: 13,
    marginTop: 16,
  },
  hint: {
    marginTop: 28,
    color: "#475569",
    fontSize: 12,
    lineHeight: 1.45,
  },
  status: {
    color: "#94a3b8",
  },
};
