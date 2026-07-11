"use client";

import { useEffect, useState } from "react";

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
    <div className="container">
      <nav>
        <a href="/">Dashboard</a>
        <a href="/chat">Chat</a>
      </nav>
      <h1>Kweni Prospect</h1>

      {error && <div className="card" style={{ color: "#ff7b72" }}>Erreur : {error}</div>}

      {stats && (
        <>
          <div className="card">
            <h2>Envoi (24h)</h2>
            <p>
              {stats.sentLast24h} / {stats.dailyLimit} emails envoyés sur les dernières 24h.
            </p>
          </div>

          <div className="card">
            <h2>Statuts</h2>
            <div className="stat-grid">
              {Object.entries(stats.byStatus || {}).map(([status, count]) => (
                <div className="stat-box" key={status}>
                  <div className="value">{count}</div>
                  <div className="label">{status}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>Types</h2>
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
            <h2>Dernier passage du scraping quotidien</h2>
            {stats.lastCronRun ? (
              <p>
                {new Date(stats.lastCronRun.ran_at).toLocaleString("fr-FR")} —{" "}
                <span className={`badge ${stats.lastCronRun.status === "success" ? "new" : "failed"}`}>
                  {stats.lastCronRun.status}
                </span>{" "}
                — {stats.lastCronRun.message}
              </p>
            ) : (
              <p>Aucun passage enregistré pour l'instant.</p>
            )}
          </div>
        </>
      )}

      <div className="card">
        <h2>Prospects</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
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
          <p>Chargement...</p>
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
                  <td colSpan={5}>Aucun prospect pour ce filtre.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
