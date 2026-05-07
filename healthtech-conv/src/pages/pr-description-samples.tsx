const samples = [
  {
    name: "Session Timeout Stability",
    value: `## Summary\nImproves timeout enforcement and resolves stale session persistence during rapid tab switching.\n\n## Changes\n- Reworked session expiry checks to use monotonic timestamps\n- Added cleanup queue to batch-expire inactive sessions\n- Added warning logs for near-expiry sessions\n\n## Results\n- 37% fewer stale sessions in staging\n- 22% lower memory usage on peak traffic\n- Zero regressions across auth integration tests\n\n## Risk\nLow. Change is scoped to session manager internals.\n\n## Validation\n- Unit + integration suites pass\n- Manual browser checks on Chrome, Firefox, Safari`
  },
  {
    name: "Audit Trail and Observability",
    value: `## Summary\nAdds complete audit visibility for session create, refresh, revoke, and expiry flows.\n\n## Changes\n- Structured JSON logs with request_id, user_id, session_id\n- Added correlation IDs to refresh token path\n- New dashboard counters for session errors and latency\n\n## Results\n- MTTR reduced from 42 min to 14 min in staging incidents\n- 100% session events now traceable end-to-end\n\n## Risk\nMedium-low. Logging schema expanded; no API contract changes.\n\n## Validation\n- Log shape snapshot tests\n- Synthetic load + tracing verification`
  }
];

export default function PrDescriptionSamplesPage() {
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "24px", fontFamily: "Segoe UI, sans-serif" }}>
      <h1>PR Description Samples</h1>
      <p style={{ color: "#475569" }}>Two completed, high-quality PR descriptions you can reuse directly.</p>
      {samples.map((sample) => (
        <article key={sample.name} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>{sample.name}</h2>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0, background: "#f8fafc", padding: 12, borderRadius: 8 }}>{sample.value}</pre>
        </article>
      ))}
    </main>
  );
}
