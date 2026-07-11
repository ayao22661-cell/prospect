"use client";

import { useEffect, useState } from "react";

const STAGES = ["new", "sent", "failed", "unsubscribed"];
const STAGE_LABELS = {
  new: "Nouveau",
  sent: "Envoyé",
  failed: "Échec",
  unsubscribed: "Désabonné",
};

function PipelineRail({ byStatus }) {
  const total = STAGES.reduce((sum, s) => sum + (byStatus?.[s] || 0), 0);

  return (
    <div className="rail-card">
      <div className="rail-heading">
        <h2>Pipeline de prospection</h2>
        <span>{total} prospect{total !== 1 ? "s" : ""} au total</span>
      </div>
      <div className="rail-track">
        {STAGES.map((stage) => {
          const count = byStatus?.[stage] || 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div
              key={stage}
              className={`rail-seg ${stage}`}
              style={{ flex: `${pct} 0 0%` }}
              title={`${STAGE_LABELS[stage]}: ${count}`}
            />
          );
        })}
      </div>
      <div className="rail-legend">
        {STAGES.map((stage) => (
          <div className="rail-legend-item" key={stage}>
            <span className={`sw ${stage}`} />
            {STAGE_LABELS[stage]} <strong>{byStatus?.[stage] || 0}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterType) params.set("type", filterType);

      const [statsRes, prospectsRes] = await Promise.all([
        fetch("/api/stats").then((r) => r.json()),
        fetch(`/api/prospects?${params}`).then((r) => r.json()),
      ]);

      if (statsRes.error) throw new Error(statsRes.error);
      if (prospectsRes.error) throw new Error(prospectsRes.error);

      setStats(statsRes);
      setProspects(prospectsRes.prospects || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterType]);

  return (
    <>
      <div className="topbar">
        <div>
          <p className="page-eyebrow">Vue d'ensemble</p>
          <h1 className="page-title">Dashboard</h1>
        </div>
        {stats && (
          <div className="quota-pill">
            <span className="live-dot" />
            <strong>{stats.sentLast24h}</strong> / {stats.dailyLimit} envoyés (24h)
          </div>
        )}
      </div>

      {error && (
        <div className="card error-card">
          <p>Erreur : {error}</p>
        </div>
      )}

      {stats && (
        <>
          <PipelineRail byStatus={stats.byStatus} />

          <div className="grid-2">
            <div className="card">
              <h2>Par type</h2>
              <div className="stat-grid">
                {Object.entries(stats.byType || {}).map(([type, count]) => (
                  <div className="stat-box" key={type}>
                    <div className="value">{count}</div>
                    <div className="label">{type}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2>Dernier scraping quotidien</h2>
              {stats.lastCronRun ? (
                <p>
                  {new Date(stats.lastCronRun.ran_at).toLocaleString("fr-FR")}
                  <br />
                  <span className={`badge ${stats.lastCronRun.status === "success" ? "success" : "failed"}`}>
                    {stats.lastCronRun.status}
                  </span>{" "}
                  — {stats.lastCronRun.message}
                </p>
              ) : (
                <p>Aucun passage enregistré pour l'instant.</p>
              )}
            </div>
          </div>
        </>
      )}

      <div className="card">
        <h2>Prospects</h2>
        <div className="table-toolbar">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tous statuts</option>
            <option value="new">new</option>
            <option value="sent">sent</option>
            <option value="failed">failed</option>
            <option value="unsubscribed">unsubscribed</option>
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Tous types</option>
            <option value="investor">investor</option>
            <option value="tester">tester</option>
            <option value="media">media</option>
            <option value="general">general</option>
          </select>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-dim)", fontSize: 13.5 }}>Chargement...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Nom</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => (
                <tr key={p.id}>
                  <td>{p.email}</td>
                  <td>{p.name || "—"}</td>
                  <td>{p.type}</td>
                  <td>
                    <span className={`badge ${p.status}`}>{p.status}</span>
                  </td>
                  <td>
                    <a href={p.source_url} target="_blank" rel="noreferrer">
                      {p.label || "source"}
                    </a>
                  </td>
                </tr>
              ))}
              {prospects.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: "var(--text-faint)" }}>
                    Aucun prospect pour ce filtre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
