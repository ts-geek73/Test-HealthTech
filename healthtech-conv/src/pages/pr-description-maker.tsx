import { useMemo, useState } from "react";

type ChecklistItem = { id: string; label: string; checked: boolean };

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "tests", label: "Added or updated tests", checked: true },
  { id: "docs", label: "Updated docs / README", checked: true },
  { id: "backward", label: "Backward compatibility verified", checked: true },
  { id: "security", label: "Security impact reviewed", checked: true },
  { id: "perf", label: "Performance impact measured", checked: true },
];

export default function PrDescriptionMakerPage() {
  const [title, setTitle] = useState("Improve session management reliability and observability");
  const [summary, setSummary] = useState(
    "This PR hardens session lifecycle handling, reduces stale session leaks, and improves troubleshooting with stronger telemetry."
  );
  const [problem, setProblem] = useState(
    "We observed intermittent stale sessions and delayed cleanup under burst traffic, making triage difficult and increasing memory pressure."
  );
  const [solution, setSolution] = useState(
    "Introduced deterministic cleanup hooks, idempotent refresh logic, and structured logging around token/session events."
  );
  const [testing, setTesting] = useState(
    "- Unit: session reducer, cleanup scheduler, token refresh guard\n- Integration: login-refresh-expire flow\n- Manual: load test with 250 concurrent users"
  );

  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);

  const markdown = useMemo(() => {
    const done = checklist
      .map((item) => `- [${item.checked ? "x" : " "}] ${item.label}`)
      .join("\\n");

    return `## Title\n${title}\n\n## Summary\n${summary}\n\n## Problem\n${problem}\n\n## Solution\n${solution}\n\n## Testing\n${testing}\n\n## Checklist\n${done}`;
  }, [title, summary, problem, solution, testing, checklist]);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px", fontFamily: "Segoe UI, sans-serif" }}>
      <h1 style={{ marginBottom: 8 }}>PR Description Maker</h1>
      <p style={{ marginTop: 0, color: "#475569" }}>
        Build powerful PR descriptions with complete data and review-ready formatting.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <section style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
          <label>PR Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", margin: "8px 0 14px", padding: 10 }} />

          <label>Summary</label>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} style={{ width: "100%", margin: "8px 0 14px", minHeight: 80, padding: 10 }} />

          <label>Problem</label>
          <textarea value={problem} onChange={(e) => setProblem(e.target.value)} style={{ width: "100%", margin: "8px 0 14px", minHeight: 80, padding: 10 }} />

          <label>Solution</label>
          <textarea value={solution} onChange={(e) => setSolution(e.target.value)} style={{ width: "100%", margin: "8px 0 14px", minHeight: 80, padding: 10 }} />

          <label>Testing</label>
          <textarea value={testing} onChange={(e) => setTesting(e.target.value)} style={{ width: "100%", margin: "8px 0 14px", minHeight: 100, padding: 10 }} />

          <div>
            <strong>Checklist</strong>
            {checklist.map((item) => (
              <label key={item.id} style={{ display: "block", marginTop: 8 }}>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) =>
                    setChecklist((prev) => prev.map((x) => (x.id === item.id ? { ...x, checked: e.target.checked } : x)))
                  }
                />{" "}
                {item.label}
              </label>
            ))}
          </div>
        </section>

        <section style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, background: "#f8fafc" }}>
          <h3 style={{ marginTop: 0 }}>Generated Markdown</h3>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{markdown}</pre>
        </section>
      </div>
    </main>
  );
}
